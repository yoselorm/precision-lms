import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockClasses } from "../../data/mockData";
import { removeCourse } from "./coursesSlice";

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
      prepare({ title, description, courses, trainerId, startDate, endDate }) {
        return {
          payload: {
            id: `cls-${nanoid(6)}`,
            title,
            description: description?.trim() || "",
            courses: courses || [],
            trainerId,
            // Rosters are built by students enrolling themselves, not set by
            // whoever creates the class.
            memberIds: [],
            startDate,
            endDate,
            status: new Date(startDate) > new Date() ? "upcoming" : "active",
          },
        };
      },
    },
    // Attach another course to an existing class (in addition to whatever's
    // already there) — used from Manage materials' "Add a course" action.
    addCourseToClass: {
      reducer(state, action) {
        const { classId, course } = action.payload;
        const cls = state.classes.find((c) => c.id === classId);
        if (!cls) return;
        if (!cls.courses) cls.courses = [];
        if (cls.courses.some((c) => c.courseId === course.courseId)) return;
        cls.courses.push(course);
      },
      prepare({ classId, courseId, mandatory }) {
        return { payload: { classId, course: { courseId, mandatory: !!mandatory } } };
      },
    },
    removeCourseFromClass(state, action) {
      const { classId, courseId } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) return;
      cls.courses = (cls.courses || []).filter((c) => c.courseId !== courseId);
    },
    setCourseMandatory(state, action) {
      const { classId, courseId, mandatory } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      const entry = cls?.courses?.find((c) => c.courseId === courseId);
      if (entry) entry.mandatory = !!mandatory;
    },
    // A student joining a class themselves — course-level enrollment records
    // for the class's attached courses are created separately by the caller
    // (dispatching enrollmentsSlice's enrollUser for each one), same way
    // ClassMaterialsPage already dispatches more than one action for a
    // single user-facing step.
    enrollInClass(state, action) {
      const { classId, userId } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) return;
      if (!cls.memberIds.includes(userId)) cls.memberIds.push(userId);
    },
    // Trainer/admin authors or edits a class's own quiz (from the Quizzes
    // page) — separate from whatever quiz lives on the attached course, and
    // only seen by students in this specific class.
    setClassQuiz(state, action) {
      const { classId, title, passingScore, timeLimitMins, maxAttempts, showAnswers, questions } = action.payload;
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) return;
      cls.quiz = {
        title: title?.trim() || "",
        passingScore: Number(passingScore) || 70,
        timeLimitMins: Number(timeLimitMins) || null,
        maxAttempts: Number(maxAttempts) || null,
        showAnswers: showAnswers !== false,
        questions: questions || [],
      };
    },
    removeClassQuiz(state, action) {
      const cls = state.classes.find((c) => c.id === action.payload.classId);
      if (cls) cls.quiz = null;
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
  extraReducers: (builder) => {
    builder.addCase(removeCourse, (state, action) => {
      state.classes.forEach((cls) => {
        cls.courses = (cls.courses || []).filter((c) => c.courseId !== action.payload.courseId);
      });
    });
  },
});

export const {
  addClass,
  addCourseToClass,
  removeCourseFromClass,
  setCourseMandatory,
  enrollInClass,
  setClassQuiz,
  removeClassQuiz,
  submitClassQuizAttempt,
} = classesSlice.actions;
export default classesSlice.reducer;

export const selectAllClasses = (state) => state.classes.classes;
export const selectClassById = (state, classId) => state.classes.classes.find((c) => c.id === classId);
export const selectClassesForUser = (state, userId) =>
  state.classes.classes.filter((c) => c.memberIds.includes(userId));
export const selectClassesByTrainer = (state, trainerId) =>
  state.classes.classes.filter((c) => c.trainerId === trainerId);
export const selectClassQuizAttempts = (state, classId, userId) =>
  state.classes.classQuizAttempts.filter((a) => a.classId === classId && a.userId === userId);
