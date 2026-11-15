import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeEnrollment } from "../../api/normalize";
import { apiThunk, listThunk } from "../apiThunk";
import { upsertCourses } from "./coursesSlice";
import { logout } from "./authSlice";

const initialState = {
  // The signed-in learner's own enrollments — the API has no way to list
  // anyone else's.
  enrollments: [],
  status: "idle",
};

// Enrollments embed their course, so those are merged into the courses list.
export const fetchEnrollments = listThunk("enrollments/fetch", async (_, { getState, dispatch }) => {
  const enrollments = await api.listEnrollments();
  dispatch(upsertCourses(enrollments.map((e) => e.course).filter(Boolean)));
  return { enrollments, userId: getState().auth.currentUser?.id };
});

// Idempotent server-side — returns the existing enrollment if there is one.
export const enrollInCourse = apiThunk("enrollments/enroll", async ({ courseId }, { getState, dispatch }) => {
  const enrollment = await api.enroll(courseId);
  if (enrollment.course) dispatch(upsertCourses([enrollment.course]));
  return { enrollment, userId: getState().auth.currentUser?.id };
});

// Progress/status are recomputed server-side (and points awarded).
export const completeLesson = apiThunk("enrollments/completeLesson", async ({ enrollmentId, lessonId }, { getState }) => ({
  enrollment: await api.completeLesson(enrollmentId, lessonId),
  userId: getState().auth.currentUser?.id,
}));

function upsert(state, { enrollment, userId }) {
  const incoming = normalizeEnrollment(enrollment, userId);
  const index = state.enrollments.findIndex((e) => e.id === incoming.id);
  if (index === -1) state.enrollments.push(incoming);
  else state.enrollments[index] = { ...incoming, topicQuizzes: state.enrollments[index].topicQuizzes };
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
        state.enrollments = enrollments.map((e) => ({
          ...normalizeEnrollment(e, userId),
          topicQuizzes: previous.get(e.id)?.topicQuizzes || {},
        }));
      })
      .addCase(fetchEnrollments.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(completeLesson.fulfilled, (state, action) => upsert(state, action.payload))
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
