import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { ApiError } from "../../api/client";
import { normalizeClass, normalizeQuiz, quizToApi } from "../../api/normalize";
import { apiThunk, listThunk, guardOf } from "../apiThunk";
import { upsertCourses, fetchAdminQuizzes, isClassQuiz } from "./coursesSlice";
import { logout } from "./authSlice";

export const initialState = {
  classes: [],
  status: "idle",
  // Classes each user has joined, by user id, remembered (and persisted)
  // from join responses — class lists don't say who's a member, only the
  // detail's roster does.
  joinedIds: {},
  // Class quiz results seen this session — the API has no attempt history.
  classQuizAttempts: [],
};

export const fetchClasses = listThunk("classes/fetch", (_, { getState }) => api.listClasses(guardOf(getState)));

// Detail includes the class's courses (the list doesn't), and for members
// its quiz. Embedded courses are merged into the courses list.
export const fetchClass = apiThunk("classes/fetchOne", async (classId, { getState, dispatch }) => {
  const guard = guardOf(getState);
  const cls = await api.getClass(guard, classId);
  if (cls.courses?.length) dispatch(upsertCourses(cls.courses));
  let quiz = null;
  if (guard !== "admin") {
    try {
      quiz = await api.getClassQuiz(classId);
    } catch (err) {
      // 404: no quiz. 403: not a member/owner. Neither is an error here.
      if (!(err instanceof ApiError && (err.status === 404 || err.status === 403))) throw err;
    }
  }
  return { cls, quiz };
});

export const createClass = apiThunk("classes/create", ({ title, description, startDate, endDate }) =>
  api.createClass({ title, description: description?.trim() || null, start_date: startDate, end_date: endDate })
);

// Owning trainer edits a class's details or moves it between
// upcoming/active/completed.
export const updateClass = apiThunk("classes/update", ({ classId, title, description, startDate, endDate, status }) =>
  api.updateClass(classId, { title, description: description?.trim() || null, start_date: startDate, end_date: endDate, status })
);

export const joinClass = apiThunk("classes/join", async ({ classId }, { getState }) => ({
  cls: await api.joinClass(classId),
  userId: getState().auth.currentUser?.id,
}));

// Course attach/detach/mandatory changes, then reload the class detail.
const classEdit = (type, fn) =>
  apiThunk(type, async (arg, { dispatch }) => {
    await fn(arg);
    await dispatch(fetchClass(arg.classId));
    return arg;
  });

export const addCourseToClass = classEdit("classes/addCourse", ({ classId, courseId, mandatory }) =>
  api.attachClassCourse(classId, courseId, mandatory)
);
export const removeCourseFromClass = classEdit("classes/removeCourse", ({ classId, courseId }) =>
  api.detachClassCourse(classId, courseId)
);
export const setCourseMandatory = classEdit("classes/setMandatory", ({ classId, courseId, mandatory }) =>
  api.setClassCourseMandatory(classId, courseId, mandatory)
);
export const setClassQuiz = classEdit("classes/setQuiz", ({ classId, ...quiz }) => api.saveClassQuiz(classId, quizToApi(quiz)));
export const removeClassQuiz = classEdit("classes/removeQuiz", ({ classId }) => api.deleteClassQuiz(classId));

// The roster comes with a class's detail; classes joined in this browser
// count too (the join may be newer than the last detail load).
function applyMembership(state, cls) {
  const joined = Object.entries(state.joinedIds)
    .filter(([, ids]) => ids.includes(cls.id))
    .map(([userId]) => userId);
  if (!joined.length) return cls;
  return { ...cls, memberIds: [...new Set([...cls.memberIds, ...joined])] };
}

function upsert(state, apiClass, extra = {}) {
  const incoming = applyMembership(state, { ...normalizeClass(apiClass), ...extra });
  const index = state.classes.findIndex((c) => c.id === incoming.id);
  if (index === -1) {
    state.classes.push(incoming);
    return;
  }
  const existing = state.classes[index];
  state.classes[index] = {
    ...incoming,
    // The list response omits courses/quiz/roster — keep what the detail fetch had.
    courses: incoming.courses ?? existing.courses,
    members: incoming.members ?? existing.members,
    memberIds: incoming.members ? incoming.memberIds : [...new Set([...existing.memberIds, ...incoming.memberIds])],
    quiz: "quiz" in extra ? extra.quiz : existing.quiz,
  };
}

const classesSlice = createSlice({
  name: "classes",
  initialState,
  reducers: {
    submitClassQuizAttempt(state, action) {
      const { classId, userId, score, passingScore, passed } = action.payload;
      state.classQuizAttempts.push({
        id: `cqa-${Date.now()}`,
        classId,
        userId,
        score,
        passed: passed ?? score >= (passingScore ?? 0),
        submittedAt: new Date().toISOString(),
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.status = "succeeded";
        const ids = new Set(action.payload.map((c) => c.id));
        state.classes = state.classes.filter((c) => ids.has(c.id));
        action.payload.forEach((c) => upsert(state, c));
      })
      .addCase(fetchClasses.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchClass.fulfilled, (state, action) => {
        upsert(state, action.payload.cls, { quiz: normalizeQuiz(action.payload.quiz) });
      })
      .addCase(createClass.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateClass.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(joinClass.fulfilled, (state, action) => {
        const { cls, userId } = action.payload;
        const ids = state.joinedIds[userId] || [];
        if (!ids.includes(cls.id)) state.joinedIds[userId] = [...ids, cls.id];
        upsert(state, cls);
      })
      .addCase(fetchAdminQuizzes.fulfilled, (state, action) => {
        const byClass = new Map(action.payload.filter(isClassQuiz).map((q) => [q.owner_id, q]));
        state.classes.forEach((cls) => {
          cls.quiz = normalizeQuiz(byClass.get(cls.id));
        });
      })
      // Keep joinedIds across logins — it's per user and can't be refetched.
      .addCase(logout, (state) => ({ ...initialState, joinedIds: state.joinedIds }));
  },
});

export const { submitClassQuizAttempt } = classesSlice.actions;
export default classesSlice.reducer;

export const selectAllClasses = (state) => state.classes.classes;
export const selectClassesStatus = (state) => state.classes.status;
export const selectClassById = (state, classId) => state.classes.classes.find((c) => c.id === classId);
export const selectClassesForUser = (state, userId) =>
  state.classes.classes.filter((c) => (state.classes.joinedIds[userId] || []).includes(c.id));
export const selectClassesByTrainer = (state, trainerId) => state.classes.classes.filter((c) => c.trainerId === trainerId);
export const selectClassQuizAttempts = (state, classId, userId) =>
  state.classes.classQuizAttempts.filter((a) => a.classId === classId && a.userId === userId);
