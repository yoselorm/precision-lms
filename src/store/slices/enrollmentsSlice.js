import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeEnrollment, normalizeWatchProgress, normalizeMyQuiz } from "../../api/normalize";
import { apiThunk, listThunk } from "../apiThunk";
import { upsertCourses } from "./coursesSlice";
import { logout } from "./authSlice";

const initialState = {
  // The signed-in learner's own enrollments — the API has no way to list
  // anyone else's.
  enrollments: [],
  status: "idle",
  // Admin: who was enrolled into what from the Enroll page this session
  // ({ userId, courseId }) — the API can't list other people's enrollments.
  adminEnrolled: [],
  // The learner's quizzes (GET /user/quizzes), with their attempt stats.
  myQuizzes: [],
  myQuizzesStatus: "idle",
};

// Enrollments embed their course, so those are merged into the courses list.
export const fetchEnrollments = listThunk("enrollments/fetch", async (_, { getState, dispatch }) => {
  const enrollments = await api.listEnrollments();
  dispatch(upsertCourses(enrollments.map((e) => e.course).filter(Boolean)));
  return { enrollments, userId: getState().auth.currentUser?.id };
});

// Admin: enrolls several users into a course. Each request is idempotent;
// resolves to { enrolled: [userId], failed: [{ userId, message }] }.
export const adminEnrollUsers = apiThunk("enrollments/adminEnroll", async ({ userIds, courseId, dueDate }) => {
  const results = await Promise.allSettled(userIds.map((userId) => api.adminEnroll(userId, courseId, dueDate)));
  const enrolled = [];
  const failed = [];
  results.forEach((result, i) =>
    result.status === "fulfilled" ? enrolled.push(userIds[i]) : failed.push({ userId: userIds[i], message: result.reason?.message || "Failed" })
  );
  return { courseId, enrolled, failed };
});

export const fetchMyQuizzes = apiThunk("enrollments/fetchMyQuizzes", () => api.listMyQuizzes());

// Idempotent server-side — returns the existing enrollment if there is one.
export const enrollInCourse = apiThunk("enrollments/enroll", async ({ courseId }, { getState, dispatch }) => {
  const enrollment = await api.enroll(courseId);
  if (enrollment.course) dispatch(upsertCourses([enrollment.course]));
  return { enrollment, userId: getState().auth.currentUser?.id };
});

// The course player loads its enrollment fresh (completed lessons and
// video watch progress).
export const fetchEnrollment = apiThunk("enrollments/fetchOne", async ({ enrollmentId }, { getState }) => ({
  enrollment: await api.getEnrollment(enrollmentId),
  userId: getState().auth.currentUser?.id,
}));

// Saves video watch progress — needed before the server will complete a
// video lesson, and lets learners resume on another device.
export const saveLessonProgress = apiThunk("enrollments/saveLessonProgress", async ({ enrollmentId, lessonId, progress }) => ({
  enrollmentId,
  saved: await api.saveLessonProgress(enrollmentId, lessonId, progress),
}));

// Progress/status are recomputed server-side (and points awarded).
export const completeLesson = apiThunk("enrollments/completeLesson", async ({ enrollmentId, lessonId }, { getState }) => ({
  enrollment: await api.completeLesson(enrollmentId, lessonId),
  userId: getState().auth.currentUser?.id,
}));

// Merges an enrollment from the API, keeping session-only quiz results and
// any completed-lesson list the response didn't include.
function merge(previous, incoming) {
  return {
    ...incoming,
    completedModuleIds: incoming.completedModuleIds ?? previous?.completedModuleIds ?? [],
    watchProgress: incoming.watchProgress ?? previous?.watchProgress ?? {},
    topicQuizzes: previous?.topicQuizzes || {},
  };
}

function upsert(state, { enrollment, userId }) {
  const incoming = normalizeEnrollment(enrollment, userId);
  const index = state.enrollments.findIndex((e) => e.id === incoming.id);
  if (index === -1) state.enrollments.push(merge(null, incoming));
  else state.enrollments[index] = merge(state.enrollments[index], incoming);
}

const enrollmentsSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    // Quiz results seen this session. The API grades attempts but has no
    // endpoint to list past ones, so scores only live until a refresh.
    submitQuizScore(state, action) {
      const { userId, courseId, topicId, score, passingScore, passed } = action.payload;
      const enrollment = state.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!enrollment) return;
      if (!enrollment.topicQuizzes[topicId]) enrollment.topicQuizzes[topicId] = { score: null, attempts: [] };
      enrollment.topicQuizzes[topicId].score = score;
      enrollment.topicQuizzes[topicId].attempts.push({
        score,
        passed: passed ?? score >= (passingScore ?? 0),
        submittedAt: new Date().toISOString(),
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { enrollments, userId } = action.payload;
        const previous = new Map(state.enrollments.map((e) => [e.id, e]));
        state.enrollments = enrollments.map((e) => merge(previous.get(e.id), normalizeEnrollment(e, userId)));
      })
      .addCase(fetchEnrollments.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(adminEnrollUsers.fulfilled, (state, action) => {
        const { courseId, enrolled } = action.payload;
        enrolled.forEach((userId) => state.adminEnrolled.push({ userId, courseId }));
      })
      .addCase(fetchMyQuizzes.pending, (state) => {
        state.myQuizzesStatus = "loading";
      })
      .addCase(fetchMyQuizzes.fulfilled, (state, action) => {
        state.myQuizzes = action.payload.map(normalizeMyQuiz);
        state.myQuizzesStatus = "succeeded";
      })
      .addCase(fetchMyQuizzes.rejected, (state) => {
        state.myQuizzesStatus = "failed";
      })
      .addCase(completeLesson.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(fetchEnrollment.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(saveLessonProgress.fulfilled, (state, action) => {
        const { enrollmentId, saved } = action.payload;
        const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
        if (enrollment && saved?.lesson_id) enrollment.watchProgress[saved.lesson_id] = normalizeWatchProgress(saved);
      })
      .addCase(logout, () => initialState);
  },
});

export const { submitQuizScore } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer;

export const selectEnrollmentsByUser = (state, userId) => state.enrollments.enrollments.filter((e) => e.userId === userId);
export const selectEnrollment = (state, userId, courseId) =>
  state.enrollments.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
export const selectAllEnrollments = (state) => state.enrollments.enrollments;
export const selectEnrollmentsStatus = (state) => state.enrollments.status;
export const selectCertificatesByUser = (state, userId) =>
  state.enrollments.enrollments.filter((e) => e.userId === userId && e.status === "completed");
