import { createSlice } from "@reduxjs/toolkit";
import * as coursesApi from "../../api/courses";
import { ApiError } from "../../api/client";
import { normalizeCourse, normalizeTopic, normalizeQuiz, normalizeRevision, withTopics, courseToApi, lessonToApi, quizToApi } from "../../api/normalize";
import { apiThunk, guardOf, roleOf } from "../apiThunk";
import { updateCategory } from "./categoriesSlice";
import { logout } from "./authSlice";

const initialState = {
  courses: [],
  // "idle" | "loading" | "succeeded" | "failed" — for the course list fetch.
  status: "idle",
};

// Admins see every course. Trainers see the approved catalog plus their own
// courses in any status; learners just the catalog.
export const fetchCourses = apiThunk("courses/fetch", async (_, { getState }) => {
  const guard = guardOf(getState);
  if (guard === "admin") return coursesApi.listCourses("admin");
  const catalog = await coursesApi.listCourses("user");
  if (roleOf(getState) !== "trainer") return catalog;
  const mine = await coursesApi.listCourses("user", { mine: true });
  const byId = new Map([...catalog, ...mine].map((c) => [c.id, c]));
  return [...byId.values()];
});

// Topic quizzes only have a user-side read (without correct answers);
// a 404 just means the topic has no quiz.
async function loadQuizzes(topics) {
  return Promise.all(
    topics.map(async (topic) => {
      try {
        return { ...topic, quiz: normalizeQuiz(await coursesApi.getTopicQuiz(topic.id)) };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return topic;
        throw err;
      }
    })
  );
}

// Loads what the current user may see of a course's topics/lessons:
// - admin: the live topics (quizzes can't be read on the admin side)
// - owning trainer: the course itself while draft/denied, or the open
//   revision of a live course (live topics aren't readable to them)
// - anyone else: nothing — the API has no learner-facing content route yet.
export const fetchCourseContent = apiThunk("courses/fetchContent", async (courseId, { getState }) => {
  const guard = guardOf(getState);
  const user = getState().auth.currentUser;
  const course = getState().courses.courses.find((c) => c.id === courseId);

  if (guard === "admin") {
    const topics = (await coursesApi.listTopics("admin", courseId)).map(normalizeTopic);
    return { courseId, topics, revision: null };
  }
  if (!course || course.createdBy !== user?.id) {
    return { courseId, unavailable: "Course content isn't available to learners from the server yet." };
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
    if (!revision) return { courseId, topics: [], revision: null };
    const normalized = normalizeRevision(revision);
    return { courseId, topics: [], revision: { ...normalized, topics: await loadQuizzes(normalized.topics) } };
  }
  const topics = (await coursesApi.listTopics("user", courseId)).map(normalizeTopic);
  return { courseId, topics: await loadQuizzes(topics), revision: null };
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

export const addLesson = contentEdit("courses/addLesson", ({ topicId, ...lesson }, guard) =>
  coursesApi.createLesson(guard, topicId, lessonToApi(lesson))
);

export const removeLesson = contentEdit("courses/removeLesson", ({ lessonId }, guard) => coursesApi.deleteLesson(guard, lessonId));

export const saveTopicQuiz = contentEdit("courses/saveTopicQuiz", ({ topicId, quiz }, guard) =>
  coursesApi.saveTopicQuiz(guard, topicId, quizToApi(quiz))
);

export const removeTopicQuiz = contentEdit("courses/removeTopicQuiz", ({ topicId }, guard) =>
  coursesApi.deleteTopicQuiz(guard, topicId)
);

// ── Trainer updates to a live course ──
export const startRevision = contentEdit("courses/startRevision", ({ courseId }) => coursesApi.startRevision(courseId));

export const submitRevision = contentEdit("courses/submitRevision", ({ courseId, revisionId }) =>
  coursesApi.submitRevision(courseId, revisionId)
);

export const discardRevision = contentEdit("courses/discardRevision", ({ courseId, revisionId }) =>
  coursesApi.discardRevision(courseId, revisionId)
);

// Admin side: needs the revision's id, which the admin API doesn't expose
// yet — only works when one is already known on the course.
export const reviewRevision = contentEdit("courses/reviewRevision", ({ courseId, revisionId, approve, reason }) => {
  if (!revisionId) throw new Error("The server doesn't list pending course updates for admins yet.");
  return coursesApi.reviewRevision(courseId, revisionId, approve ? "approved" : "denied", reason);
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
    topics: existing.topics,
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
        const { courseId, topics, revision, unavailable } = action.payload;
        const index = state.courses.findIndex((c) => c.id === courseId);
        if (index === -1) return;
        if (unavailable) {
          state.courses[index].contentStatus = "unavailable";
          state.courses[index].contentError = unavailable;
          return;
        }
        state.courses[index] = { ...withTopics(state.courses[index], topics), revision, contentStatus: "succeeded", contentError: null };
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
