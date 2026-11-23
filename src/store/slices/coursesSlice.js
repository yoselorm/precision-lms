import { createSlice } from "@reduxjs/toolkit";
import * as coursesApi from "../../api/courses";
import { ApiError } from "../../api/client";
import { normalizeCourse, normalizeTopic, normalizeQuiz, normalizeRevision, withTopics, courseToApi, lessonToApi, quizToApi } from "../../api/normalize";
import { apiThunk, listThunk, guardOf, roleOf } from "../apiThunk";
import { updateCategory } from "./categoriesSlice";
import { logout } from "./authSlice";

const initialState = {
  courses: [],
  // "idle" | "loading" | "succeeded" | "failed" — for the course list fetch.
  status: "idle",
};

// Admins see every course. Trainers see the approved catalog plus their own
// courses in any status; learners just the catalog; signed-out visitors the
// public catalog.
export const fetchCourses = listThunk("courses/fetch", async (_, { getState }) => {
  const guard = guardOf(getState);
  if (!guard) return coursesApi.listPublicCourses();
  // Only the public catalog carries ratings so far, so signed-in lists
  // borrow them from it (if it fails, courses just show no stars).
  const ratings = coursesApi.listPublicCourses().catch(() => []);
  let courses;
  if (guard === "admin") courses = await coursesApi.listCourses("admin");
  else {
    const catalog = await coursesApi.listCourses("user");
    if (roleOf(getState) !== "trainer") courses = catalog;
    else {
      const mine = await coursesApi.listCourses("user", { mine: true });
      courses = [...new Map([...catalog, ...mine].map((c) => [c.id, c])).values()];
    }
  }
  return withPublicRatings(courses, await ratings);
});

function withPublicRatings(courses, publicCourses) {
  const byId = new Map(publicCourses.map((c) => [c.id, c]));
  return courses.map((c) => {
    const pub = byId.get(c.id);
    if (!pub || c.average_rating !== undefined) return c;
    return { ...c, average_rating: pub.average_rating ?? null, ratings_count: pub.ratings_count ?? 0 };
  });
}

// The server's "no such route" 404 (as opposed to "this has no quiz").
const isMissingRoute = (err) => err instanceof ApiError && (err.status === 405 || (err.status === 404 && /route .* could not be found/i.test(err.message)));

// Quiz owner types whose routes the server turned out not to have (course
// and lesson quizzes, until the backend adds them) — not asked again this
// session, rather than one failing request per lesson.
const missingQuizRoutes = new Set();

// A course, topic or lesson's quiz, or null — a 404 just means it has none.
async function loadQuiz(owner) {
  if (missingQuizRoutes.has(owner.type)) return null;
  try {
    return normalizeQuiz(await coursesApi.getQuiz(owner));
  } catch (err) {
    if (isMissingRoute(err)) missingQuizRoutes.add(owner.type);
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) return null;
    throw err;
  }
}

// User-side reads (learner view, or with answers for the owning trainer).
// Topics say whether they have a quiz, so only those are fetched.
async function loadQuizzes(topics) {
  return Promise.all(
    topics.map(async (topic) => {
      const [quiz, lessons] = await Promise.all([
        topic.quizSummary ? loadQuiz({ type: "topic", id: topic.id }) : null,
        Promise.all(topic.lessons.map(async (lesson) => ({ ...lesson, quiz: await loadQuiz({ type: "lesson", id: lesson.id }) }))),
      ]);
      return { ...topic, quiz, lessons };
    })
  );
}

// Admin quizzes identify their owner only by type ("App\\Models\\Topic" or a
// class model) and id.
export const isTopicQuiz = (q) => /topic$/i.test(q.owner_type || "");
export const isClassQuiz = (q) => /class$/i.test(q.owner_type || "");
export const isCourseQuiz = (q) => /course$/i.test(q.owner_type || "");
export const isLessonQuiz = (q) => /lesson$/i.test(q.owner_type || "");

// Attaches admin-list quizzes to a course's topics and lessons.
function attachAdminQuizzes(topics, quizzes) {
  const byOwner = (test) => new Map(quizzes.filter(test).map((q) => [q.owner_id, q]));
  const topicQuizzes = byOwner(isTopicQuiz);
  const lessonQuizzes = byOwner(isLessonQuiz);
  return topics.map((t) => ({
    ...t,
    quiz: normalizeQuiz(topicQuizzes.get(t.id)),
    lessons: t.lessons.map((l) => ({ ...l, quiz: normalizeQuiz(lessonQuizzes.get(l.id)) })),
  }));
}

// Admin: every quiz with its answers — attached to loaded topics here and to
// classes in the classes slice.
export const fetchAdminQuizzes = apiThunk("courses/fetchAdminQuizzes", () => coursesApi.listAdminQuizzes());

// Loads what the current user may see of a course's topics/lessons:
// - admin: the live topics, with quizzes from the admin quiz list
// - owning trainer: the course itself while draft/denied; for a live course
//   the live topics plus their open revision (the editable copy), if any
// - learner: the live topics of a course they're enrolled in (403 otherwise)
export const fetchCourseContent = apiThunk("courses/fetchContent", async (courseId, { getState }) => {
  const guard = guardOf(getState);
  const user = getState().auth.currentUser;
  const course = getState().courses.courses.find((c) => c.id === courseId);

  if (guard === "admin") {
    const [apiTopics, quizzes] = await Promise.all([coursesApi.listTopics("admin", courseId), coursesApi.listAdminQuizzes()]);
    const topics = attachAdminQuizzes(apiTopics.map(normalizeTopic), quizzes);
    const courseQuiz = normalizeQuiz(quizzes.find((q) => isCourseQuiz(q) && q.owner_id === courseId));
    // Pending updates come from the revisions list (fetchPendingRevisions).
    return { courseId, topics, courseQuiz, revision: undefined };
  }
  if (!course || course.createdBy !== user?.id) {
    try {
      const topics = (await coursesApi.getCourseContent(courseId)).map(normalizeTopic);
      const [withQuizzes, courseQuiz] = await Promise.all([loadQuizzes(topics), loadQuiz({ type: "course", id: courseId })]);
      return { courseId, topics: withQuizzes, courseQuiz, revision: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return { courseId, unavailable: "Enroll in this course to see its lessons." };
      }
      throw err;
    }
  }
  if (course.status === "pending") {
    return { courseId, unavailable: "Course content can't be viewed while it's awaiting approval." };
  }
  if (course.status === "approved") {
    let revision = null;
    try {
      revision = await coursesApi.getCurrentRevision(courseId);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) throw err;
    }
    // Live content (what learners see), for previewing the course.
    const [live, courseQuiz] = await Promise.all([
      coursesApi.getCourseContent(courseId).then((t) => loadQuizzes(t.map(normalizeTopic))),
      loadQuiz({ type: "course", id: courseId }),
    ]);
    if (!revision) return { courseId, topics: live, courseQuiz, revision: null };
    const normalized = normalizeRevision(revision);
    return { courseId, topics: live, courseQuiz, revision: { ...normalized, topics: await loadQuizzes(normalized.topics) } };
  }
  const topics = (await coursesApi.listTopics("user", courseId)).map(normalizeTopic);
  const [withQuizzes, courseQuiz] = await Promise.all([loadQuizzes(topics), loadQuiz({ type: "course", id: courseId })]);
  return { courseId, topics: withQuizzes, courseQuiz, revision: null };
});

export const createCourse = apiThunk("courses/create", (form, { getState }) => {
  const guard = guardOf(getState);
  const body = courseToApi({ ...form, createdBy: guard === "admin" ? form.createdBy : undefined });
  return coursesApi.createCourse(guard, body);
});

// Course details (not content). Trainers can only edit while draft/denied;
// admins any time.
export const updateCourse = apiThunk("courses/update", ({ courseId, ...form }, { getState }) =>
  coursesApi.updateCourse(guardOf(getState), courseId, courseToApi(form))
);

export const deleteCourse = apiThunk("courses/delete", async ({ courseId }) => {
  await coursesApi.deleteCourse(courseId);
  return { courseId };
});

// Admin approves or denies a submitted course.
export const reviewCourse = apiThunk("courses/review", ({ courseId, status, reason }) =>
  coursesApi.reviewCourse(courseId, status, reason)
);

export const submitCourse = apiThunk("courses/submit", ({ courseId }) => coursesApi.submitCourse(courseId));

export const setCourseOwner = apiThunk("courses/setOwner", ({ courseId, trainerId }) =>
  coursesApi.setCourseOwner(courseId, trainerId)
);

// Content edits go to whichever container the server considers editable, so
// after each one we just reload the course's content.
const contentEdit = (type, fn) =>
  apiThunk(type, async (arg, { getState, dispatch }) => {
    await fn(arg, guardOf(getState));
    await dispatch(fetchCourseContent(arg.courseId));
    return { courseId: arg.courseId };
  });

export const addTopic = contentEdit("courses/addTopic", ({ courseId, title, description }, guard) =>
  coursesApi.createTopic(guard, courseId, { title, description: description?.trim() || null })
);

export const removeTopic = contentEdit("courses/removeTopic", ({ topicId }, guard) => coursesApi.deleteTopic(guard, topicId));

export const editTopic = contentEdit("courses/editTopic", ({ topicId, title, description }, guard) =>
  coursesApi.updateTopic(guard, topicId, { title, description: description?.trim() || null })
);

// Saves a new order by renumbering every item (sort_order 0..n-1) — items
// often share a sort_order, so swapping two values isn't enough.
export const reorderTopics = contentEdit("courses/reorderTopics", ({ topicIds }, guard) =>
  Promise.all(topicIds.map((id, index) => coursesApi.updateTopic(guard, id, { sort_order: index })))
);

export const editLesson = contentEdit("courses/editLesson", ({ lessonId, ...lesson }, guard) =>
  coursesApi.updateLesson(guard, lessonId, lessonToApi(lesson))
);

export const reorderLessons = contentEdit("courses/reorderLessons", ({ lessonIds }, guard) =>
  Promise.all(lessonIds.map((id, index) => coursesApi.updateLesson(guard, id, { sort_order: index })))
);

export const addLesson = contentEdit("courses/addLesson", ({ topicId, ...lesson }, guard) =>
  coursesApi.createLesson(guard, topicId, lessonToApi(lesson))
);

export const removeLesson = contentEdit("courses/removeLesson", ({ lessonId }, guard) => coursesApi.deleteLesson(guard, lessonId));

// Course and lesson quiz routes may not exist on the server yet — say so
// plainly instead of "The route … could not be found".
async function quizRequest(owner, call) {
  try {
    return await call();
  } catch (err) {
    if (owner.type !== "topic" && err instanceof ApiError && (err.status === 405 || (err.status === 404 && /could not be found/i.test(err.message)))) {
      throw new Error(`${owner.type === "course" ? "Course" : "Lesson"} quizzes aren't available on the server yet — the backend needs to add them.`);
    }
    throw err;
  }
}

// owner: { type: "course" | "topic" | "lesson", id }.
export const saveQuiz = contentEdit("courses/saveQuiz", ({ owner, quiz }, guard) =>
  quizRequest(owner, () => coursesApi.saveQuiz(guard, owner, quizToApi(quiz)))
);

export const removeQuiz = contentEdit("courses/removeQuiz", ({ owner }, guard) =>
  quizRequest(owner, () => coursesApi.deleteQuiz(guard, owner))
);

// ── Trainer updates to a live course ──
export const startRevision = contentEdit("courses/startRevision", ({ courseId }) => coursesApi.startRevision(courseId));

export const submitRevision = contentEdit("courses/submitRevision", ({ courseId, revisionId }) =>
  coursesApi.submitRevision(courseId, revisionId)
);

export const discardRevision = contentEdit("courses/discardRevision", ({ courseId, revisionId }) =>
  coursesApi.discardRevision(courseId, revisionId)
);

// Admin: every course update awaiting review, attached to its course as
// `revision` (with the proposed topics, for previewing).
export const fetchPendingRevisions = apiThunk("courses/fetchPendingRevisions", () => coursesApi.listCourseRevisions("pending"));

export const reviewRevision = apiThunk("courses/reviewRevision", async ({ courseId, revisionId, approve, reason }, { dispatch }) => {
  if (!revisionId) throw new Error("This update couldn't be found — refresh the page and try again.");
  await coursesApi.reviewRevision(courseId, revisionId, approve ? "approved" : "denied", reason);
  await Promise.all([dispatch(fetchCourseContent(courseId)), dispatch(fetchPendingRevisions())]);
  return { courseId, revisionId };
});

function upsert(state, apiCourse) {
  const incoming = normalizeCourse(apiCourse);
  const index = state.courses.findIndex((c) => c.id === incoming.id);
  if (index === -1) {
    state.courses.push(incoming);
    return;
  }
  // Keep already-loaded content when only the course record changed.
  const existing = state.courses[index];
  state.courses[index] = {
    ...incoming,
    // Responses without ratings (enrollments, classes) keep the known ones.
    averageRating: incoming.averageRating === undefined ? existing.averageRating : incoming.averageRating,
    ratingsCount: incoming.ratingsCount === undefined ? existing.ratingsCount : incoming.ratingsCount,
    topics: existing.topics,
    quiz: existing.quiz,
    revision: existing.revision,
    certificate: existing.certificate,
    contentStatus: existing.contentStatus,
    contentError: existing.contentError,
    review: incoming.status === "approved" ? null : existing.review,
  };
}

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    // Courses also arrive embedded in enrollments and classes — merge them
    // in so pages can look them up by id.
    upsertCourses(state, action) {
      action.payload.forEach((c) => upsert(state, c));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        const ids = new Set(action.payload.map((c) => c.id));
        // Drop courses that no longer exist server-side, then merge.
        state.courses = state.courses.filter((c) => ids.has(c.id));
        action.payload.forEach((c) => upsert(state, c));
      })
      .addCase(fetchCourses.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchCourseContent.pending, (state, action) => {
        const course = state.courses.find((c) => c.id === action.meta.arg);
        if (course && course.contentStatus === "idle") course.contentStatus = "loading";
      })
      .addCase(fetchCourseContent.fulfilled, (state, action) => {
        const { courseId, topics, revision, unavailable, courseQuiz } = action.payload;
        const index = state.courses.findIndex((c) => c.id === courseId);
        if (index === -1) return;
        if (unavailable) {
          state.courses[index].contentStatus = "unavailable";
          state.courses[index].contentError = unavailable;
          return;
        }
        const sorted = [...topics].sort((a, b) => a.sortOrder - b.sortOrder);
        const sortedRevision = revision && { ...revision, topics: [...revision.topics].sort((a, b) => a.sortOrder - b.sortOrder) };
        state.courses[index] = {
          ...withTopics(state.courses[index], sorted),
          quiz: courseQuiz ?? null,
          // undefined: this load doesn't cover revisions — keep what's known.
          revision: revision === undefined ? state.courses[index].revision : sortedRevision,
          contentStatus: "succeeded",
          contentError: null,
        };
      })
      .addCase(fetchCourseContent.rejected, (state, action) => {
        const course = state.courses.find((c) => c.id === action.meta.arg);
        if (!course) return;
        course.contentStatus = "failed";
        course.contentError = action.payload;
      })
      .addCase(createCourse.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateCourse.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(reviewCourse.fulfilled, (state, action) => {
        upsert(state, action.payload);
        // The API doesn't return the denial reason with the course, so keep
        // the one the admin just entered for this session.
        const { courseId, status, reason } = action.meta.arg;
        const course = state.courses.find((c) => c.id === courseId);
        if (course && status === "denied") course.review = { reason: reason?.trim() || "", deniedAt: new Date().toISOString() };
      })
      .addCase(submitCourse.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(setCourseOwner.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c.id !== action.payload.courseId);
      })
      .addCase(fetchPendingRevisions.fulfilled, (state, action) => {
        const pending = new Map(action.payload.map((r) => [r.course_id || r.course?.id, r]));
        state.courses.forEach((course) => {
          const r = pending.get(course.id);
          if (r) {
            const revision = normalizeRevision(r);
            course.revision = { ...revision, topics: [...revision.topics].sort((a, b) => a.sortOrder - b.sortOrder) };
          } else if (course.revision?.status === "pending") course.revision = null;
        });
      })
      .addCase(fetchAdminQuizzes.fulfilled, (state, action) => {
        state.courses.forEach((course) => {
          course.topics = attachAdminQuizzes(course.topics, action.payload);
          course.quiz = normalizeQuiz(action.payload.find((q) => isCourseQuiz(q) && q.owner_id === course.id));
        });
      })
      // Courses store their category by name, so follow admin renames.
      .addCase(updateCategory.fulfilled, (state, action) => {
        const { previousName } = action.meta.arg;
        state.courses.forEach((c) => {
          if (c.category === previousName) c.category = action.payload.name;
        });
      })
      .addCase(logout, () => initialState);
  },
});

export const { upsertCourses } = coursesSlice.actions;
export default coursesSlice.reducer;

export const selectAllCourses = (state) => state.courses.courses;
export const selectCoursesStatus = (state) => state.courses.status;
export const selectCourseById = (state, courseId) => state.courses.courses.find((c) => c.id === courseId);
// The public-facing catalog only ever shows approved courses — trainer
// submissions stay invisible to learners until an admin reviews them.
export const selectPublicCourses = (state) => state.courses.courses.filter((c) => c.status === "approved");
export const selectCoursesByCreator = (state, creatorId) => state.courses.courses.filter((c) => c.createdBy === creatorId);
// New courses awaiting approval, plus live courses with a submitted update.
export const selectPendingCourses = (state) =>
  state.courses.courses.filter((c) => c.status === "pending" || c.revision?.status === "pending");

// The topics a trainer is working on: their unpublished update if there is
// one, otherwise the live topics.
export const editableTopicsOf = (course) => course.revision?.topics ?? course.topics;
// Trainers' edits to a live course go through re-approval.
export const editsNeedApproval = (course, user) => user?.role === "trainer" && course.status === "approved";
