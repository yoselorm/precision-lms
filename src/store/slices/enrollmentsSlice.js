import { createSlice } from "@reduxjs/toolkit";
import { mockEnrollments } from "../../data/mockData";

const initialState = {
  enrollments: mockEnrollments,
};

const enrollmentsSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    enrollUser: {
      reducer(state, action) {
        const { userId, courseId } = action.payload;
        const exists = state.enrollments.some((e) => e.userId === userId && e.courseId === courseId);
        if (exists) return;
        state.enrollments.push(action.payload);
      },
      prepare({ userId, courseId, dueDate }) {
        return {
          payload: {
            id: `e-${userId}-${courseId}`,
            userId,
            courseId,
            status: "not-started",
            progress: 0,
            completedModuleIds: [],
            quizScore: null,
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          },
        };
      },
    },
    completeModule(state, action) {
      const { userId, courseId, moduleId, totalModules } = action.payload;
      const enrollment = state.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!enrollment) return;
      if (!enrollment.completedModuleIds.includes(moduleId)) {
        enrollment.completedModuleIds.push(moduleId);
      }
      enrollment.progress = Math.round((enrollment.completedModuleIds.length / totalModules) * 100);
      enrollment.status = enrollment.progress >= 100 ? "completed" : "in-progress";
      if (enrollment.status === "completed" && !enrollment.completedAt) {
        enrollment.completedAt = new Date().toISOString().slice(0, 10);
      }
    },
    submitQuizScore(state, action) {
      const { userId, courseId, score } = action.payload;
      const enrollment = state.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
      if (!enrollment) return;
      enrollment.quizScore = score;
    },
  },
});

export const { completeModule, submitQuizScore, enrollUser } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer;

export const selectEnrollmentsByUser = (state, userId) =>
  state.enrollments.enrollments.filter((e) => e.userId === userId);

export const selectEnrollment = (state, userId, courseId) =>
  state.enrollments.enrollments.find((e) => e.userId === userId && e.courseId === courseId);

export const selectAllEnrollments = (state) => state.enrollments.enrollments;

export const selectCertificatesByUser = (state, userId) =>
  state.enrollments.enrollments.filter((e) => e.userId === userId && e.status === "completed");
