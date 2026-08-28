import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockClasses } from "../../data/mockData";

const initialState = {
  classes: mockClasses,
  // One row per (class, user) quiz submission — kept separate from
  // enrollments because class membership doesn't imply a course enrollment
  // record exists, and a class quiz is a distinct assessment from the
  // course's own quiz.
  classQuizAttempts: [],
};

const classesSlice = createSlice({
  name: "classes",
  initialState,
  reducers: {
    addClass: {
      reducer(state, action) {
        state.classes.push(action.payload);
      },
      prepare({ title, courseId, trainerId, memberIds, startDate, endDate }) {
        return {
          payload: {
            id: `cls-${nanoid(6)}`,
            title,
            courseId,
            trainerId,
            memberIds: memberIds || [],
            startDate,
            endDate,
            status: new Date(startDate) > new Date() ? "upcoming" : "active",
          },
        };
      },
    },
    // Attach a different (or newly created) course to an existing class —
    // used when a trainer/admin swaps out the material a class is built on.
    setClassCourse(state, action) {
      const { classId, courseId } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      if (cls) cls.courseId = courseId;
    },
    // Trainer/admin authors or edits a class's own quiz — separate from
    // whatever quiz lives on the attached course, and only seen by students
    // in this specific class.
    setClassQuiz(state, action) {
      const { classId, passingScore, timeLimitMins, questions } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) return;
      cls.quiz = {
        passingScore: Number(passingScore) || 70,
        timeLimitMins: Number(timeLimitMins) || null,
        questions: questions || [],
      };
    },
    submitClassQuizAttempt(state, action) {
      const { classId, userId, score, passingScore } = action.payload;
      state.classQuizAttempts.push({
        id: `cqa-${nanoid(6)}`,
        classId,
        userId,
        score,
        passed: score >= (passingScore ?? 0),
        submittedAt: new Date().toISOString(),
      });
    },
  },
});

export const { addClass, setClassCourse, setClassQuiz, submitClassQuizAttempt } = classesSlice.actions;
export default classesSlice.reducer;

export const selectAllClasses = (state) => state.classes.classes;
export const selectClassById = (state, classId) => state.classes.classes.find((c) => c.id === classId);
export const selectClassesForUser = (state, userId) =>
  state.classes.classes.filter((c) => c.memberIds.includes(userId));
export const selectClassesByTrainer = (state, trainerId) =>
  state.classes.classes.filter((c) => c.trainerId === trainerId);
export const selectClassQuizAttempts = (state, classId, userId) =>
  state.classes.classQuizAttempts.filter((a) => a.classId === classId && a.userId === userId);
