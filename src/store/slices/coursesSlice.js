import { createSlice, current, nanoid } from "@reduxjs/toolkit";
import { mockCourses } from "../../data/mockData";

// When a trainer edits a course that's already live, their changes go into a
// separate `revision` copy of the topics instead. Learners keep the approved
// version until an admin approves the update. Editing actions pass
// `revision: true` to target that copy (creating it on the first edit).
function topicsToEdit(course, useRevision) {
  if (!useRevision) return course.topics;
  if (!course.revision) {
    course.revision = { topics: JSON.parse(JSON.stringify(current(course.topics))), status: "editing", review: null };
  }
  return course.revision.topics;
}

const lessonMinutes = (topics) => topics.reduce((sum, t) => sum + t.lessons.reduce((s, l) => s + (l.durationMins || 0), 0), 0);

const initialState = {
  courses: mockCourses,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    // Shell-only course creation — used by the admin and trainer "Add
    // course" forms. Topics/lessons/quizzes are added afterward via the
    // course-manage page. Admin-authored courses go live immediately;
    // trainer-authored ones start as a "draft" the trainer keeps building,
    // then move to "pending" once submitted for admin approval.
    addCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, mandatory, durationMins, price, description, certificateTitle, thumbnailImage, creatorId, status }) {
        const id = `c-${nanoid(6)}`;
        return {
          payload: {
            id,
            title,
            category,
            mandatory: !!mandatory,
            durationMins: Number(durationMins) || 30,
            thumbnailColor: "#0f766e",
            thumbnailImage: thumbnailImage || `https://picsum.photos/seed/${id}/480/300`,
            studentsCount: 0,
            updatedDate: new Date().toISOString().slice(0, 10),
            price: Number(price) || 0,
            certificate: certificateTitle ? { title: certificateTitle, issuer: "Learning & Development" } : null,
            description: description || "",
            topics: [],
            createdBy: creatorId || null,
            status: status || "approved",
          },
        };
      },
    },

    // Bare-bones course, created inline from the "set up a class" flow when
    // there's no existing course to attach — materials get added afterward
    // via the topic/lesson reducers below. Same approval rule as addCourse.
    createBlankCourse: {
      reducer(state, action) {
        state.courses.push(action.payload);
      },
      prepare({ title, category, thumbnailImage, creatorId, status }) {
        const id = `c-${nanoid(6)}`;
        return {
          payload: {
            id,
            title,
            category: category || "Technical Skills",
            mandatory: false,
            durationMins: 0,
            thumbnailColor: "#0f766e",
            thumbnailImage: thumbnailImage || `https://picsum.photos/seed/${id}/480/300`,
            studentsCount: 0,
            updatedDate: new Date().toISOString().slice(0, 10),
            price: 0,
            certificate: null,
            description: "",
            topics: [],
            createdBy: creatorId || null,
            status: status || "approved",
          },
        };
      },
    },

    // Trainer deletes their own course before it's published (draft, pending
    // or denied). Classes and assignments drop their references to it via
    // their own extraReducers.
    removeCourse(state, action) {
      state.courses = state.courses.filter((c) => c.id !== action.payload.courseId);
    },

    // Trainer submits a finished draft ("pending"), or an admin approves or
    // denies it — controls whether it's visible in the public course catalog.
    // A denial carries the admin's feedback for the trainer; it stays on the
    // course (so the trainer can act on it and resubmit) until approval.
    setCourseStatus(state, action) {
      const { courseId, status, reason } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.status = status;
      if (status === "denied") course.review = { reason: reason?.trim() || "", deniedAt: new Date().toISOString() };
      if (status === "approved") course.review = null;
    },

    // Trainer or admin adding a new topic to a course — used both from
    // Admin > Courses manage page and from a trainer managing their class's
    // materials.
    addTopicToCourse: {
      reducer(state, action) {
        const { courseId, topic, revision } = action.payload;
        const course = state.courses.find((c) => c.id === courseId);
        if (!course) return;
        topicsToEdit(course, revision).push(topic);
      },
      prepare({ courseId, title, revision }) {
        return {
          payload: {
            courseId,
            revision: !!revision,
            topic: {
              id: `${courseId}-t${nanoid(6)}`,
              title,
              lessons: [],
              quiz: null,
            },
          },
        };
      },
    },

    removeTopicFromCourse(state, action) {
      const { courseId, topicId, revision } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      const topics = topicsToEdit(course, revision);
      topics.splice(0, topics.length, ...topics.filter((t) => t.id !== topicId));
    },

    // Adds a video/text/document lesson to an existing topic.
    addLessonToTopic: {
      reducer(state, action) {
        const { courseId, topicId, lesson, revision } = action.payload;
        const course = state.courses.find((c) => c.id === courseId);
        const topic = course && topicsToEdit(course, revision).find((t) => t.id === topicId);
        if (!topic) return;
        topic.lessons.push(lesson);
        if (!revision) course.durationMins += lesson.durationMins;
      },
      prepare({ courseId, topicId, title, type, durationMins, videoUrl, body, fileUrl, revision }) {
        return {
          payload: {
            courseId,
            revision: !!revision,
            topicId,
            lesson: {
              id: `${topicId}-l${nanoid(6)}`,
              title,
              type,
              durationMins: Number(durationMins) || 10,
              videoUrl: type === "video" ? videoUrl || "" : undefined,
              body: type === "text" ? body || "" : undefined,
              fileUrl: type === "document" ? fileUrl || "" : undefined,
            },
          },
        };
      },
    },

    removeLessonFromTopic(state, action) {
      const { courseId, topicId, lessonId, revision } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const topic = course && topicsToEdit(course, revision).find((t) => t.id === topicId);
      if (!topic) return;
      const lesson = topic.lessons.find((l) => l.id === lessonId);
      if (lesson && !revision) course.durationMins -= lesson.durationMins;
      topic.lessons = topic.lessons.filter((l) => l.id !== lessonId);
    },

    // Admin creates, edits or removes the certificate linked to a course from
    // Admin > Certificates. Fields passed are merged into the existing
    // certificate (so saving the title keeps a custom design `template`, and
    // saving the design keeps the title). Passing a null certificate unlinks it.
    setCourseCertificate(state, action) {
      const { courseId, certificate } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return;
      course.certificate = certificate
        ? { issuer: "Learning & Development", ...course.certificate, ...certificate }
        : null;
    },

    // Admin/trainer authors or edits a topic's quiz via QuizBuilder —
    // replaces the quiz wholesale since the builder always submits the full
    // working set of questions.
    setTopicQuiz(state, action) {
      const { courseId, topicId, title, passingScore, timeLimitMins, maxAttempts, showAnswers, questions, revision } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const topic = course && topicsToEdit(course, revision).find((t) => t.id === topicId);
      if (!topic) return;
      topic.quiz = {
        title: title?.trim() || "",
        passingScore: Number(passingScore) || 70,
        timeLimitMins: Number(timeLimitMins) || null,
        maxAttempts: Number(maxAttempts) || null,
        showAnswers: showAnswers !== false,
        questions: questions || [],
      };
    },

    removeTopicQuiz(state, action) {
      const { courseId, topicId, revision } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      const topic = course && topicsToEdit(course, revision).find((t) => t.id === topicId);
      if (topic) topic.quiz = null;
    },

    // ── Updates to a live course (see topicsToEdit) ──
    submitCourseUpdate(state, action) {
      const course = state.courses.find((c) => c.id === action.payload.courseId);
      if (course?.revision) course.revision.status = "pending";
    },
    discardCourseUpdate(state, action) {
      const course = state.courses.find((c) => c.id === action.payload.courseId);
      if (course) course.revision = null;
    },
    // Admin approves (publishes the updated topics) or denies with feedback.
    reviewCourseUpdate(state, action) {
      const { courseId, approve, reason } = action.payload;
      const course = state.courses.find((c) => c.id === courseId);
      if (!course?.revision) return;
      if (approve) {
        course.topics = course.revision.topics;
        course.durationMins = lessonMinutes(course.topics);
        course.updatedDate = new Date().toISOString().slice(0, 10);
        course.revision = null;
      } else {
        course.revision.status = "denied";
        course.revision.review = { reason: reason?.trim() || "", deniedAt: new Date().toISOString() };
      }
    },
  },
});

export const {
  addCourse,
  createBlankCourse,
  setCourseStatus,
  removeCourse,
  addTopicToCourse,
  removeTopicFromCourse,
  addLessonToTopic,
  removeLessonFromTopic,
  setCourseCertificate,
  setTopicQuiz,
  removeTopicQuiz,
  submitCourseUpdate,
  discardCourseUpdate,
  reviewCourseUpdate,
} = coursesSlice.actions;
export default coursesSlice.reducer;

export const selectAllCourses = (state) => state.courses.courses;
export const selectCourseById = (state, courseId) =>
  state.courses.courses.find((c) => c.id === courseId);
// The public-facing catalog only ever shows approved courses — trainer
// submissions stay invisible to learners until an admin reviews them.
export const selectPublicCourses = (state) =>
  state.courses.courses.filter((c) => (c.status || "approved") === "approved");
export const selectCoursesByCreator = (state, creatorId) =>
  state.courses.courses.filter((c) => c.createdBy === creatorId);
// New courses awaiting approval, plus live courses with a submitted update.
export const selectPendingCourses = (state) =>
  state.courses.courses.filter((c) => c.status === "pending" || c.revision?.status === "pending");

// The topics a trainer is working on: their unpublished update if there is
// one, otherwise the live topics.
export const editableTopicsOf = (course) => course.revision?.topics ?? course.topics;
// Trainers' edits to a live course go through re-approval.
export const editsNeedApproval = (course, user) => user?.role === "trainer" && (course.status || "approved") === "approved";
