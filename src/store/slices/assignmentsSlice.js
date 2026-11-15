import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeAssignment } from "../../api/normalize";
import { apiThunk, listThunk, guardOf, roleOf } from "../apiThunk";
import { deleteCourse } from "./coursesSlice";
import { logout } from "./authSlice";

const initialState = {
  assignments: [],
  status: "idle",
};

// Admins get everything in one call. Users can only list per class or per
// course, so we ask for each class/course they're involved with: a
// trainer's own classes and courses, a learner's joined classes and
// enrolled courses. Load classes, courses and enrollments first.
export const fetchAssignments = listThunk("assignments/fetch", async (_, { getState }) => {
  if (guardOf(getState) === "admin") return api.listAllAssignments();
  const state = getState();
  const userId = state.auth.currentUser?.id;
  let classIds;
  let courseIds;
  if (roleOf(getState) === "trainer") {
    classIds = state.classes.classes.filter((c) => c.trainerId === userId).map((c) => c.id);
    courseIds = state.courses.courses.filter((c) => c.createdBy === userId).map((c) => c.id);
  } else {
    classIds = state.classes.joinedIds[userId] || [];
    courseIds = state.enrollments.enrollments.map((e) => e.courseId);
  }
  const lists = await Promise.all([
    ...classIds.map((classId) => api.listAssignments({ classId }).catch(() => [])),
    ...courseIds.map((courseId) => api.listAssignments({ courseId }).catch(() => [])),
  ]);
  const byId = new Map(lists.flat().map((a) => [a.id, a]));
  return [...byId.values()];
});

export const addAssignment = apiThunk("assignments/create", ({ classId, courseId, title, instructions, dueDate, autoCloseOnDueDate }) =>
  api.createAssignment({
    school_class_id: classId || null,
    course_id: courseId || null,
    title,
    instructions,
    due_date: dueDate || null,
    auto_close_on_due_date: !!autoCloseOnDueDate,
  })
);

export const updateAssignment = apiThunk("assignments/update", ({ id, title, instructions, dueDate, autoCloseOnDueDate }) =>
  api.updateAssignment(id, {
    title,
    instructions,
    due_date: dueDate || null,
    auto_close_on_due_date: !!autoCloseOnDueDate,
  })
);

// Manual close/reopen — independent of auto-close-on-due-date.
export const setAssignmentStatus = apiThunk("assignments/setStatus", ({ id, status }) => api.setAssignmentStatus(id, status));

export const removeAssignment = apiThunk("assignments/delete", async ({ id }) => {
  await api.deleteAssignment(id);
  return { id };
});

function upsert(state, apiAssignment) {
  const incoming = normalizeAssignment(apiAssignment);
  const index = state.assignments.findIndex((a) => a.id === incoming.id);
  if (index === -1) state.assignments.push(incoming);
  else state.assignments[index] = incoming;
}

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.assignments = action.payload.map(normalizeAssignment);
      })
      .addCase(fetchAssignments.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(addAssignment.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateAssignment.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(setAssignmentStatus.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(removeAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter((a) => a.id !== action.payload.id);
      })
      // Deleting a course cascades server-side.
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter((a) => a.courseId !== action.payload.courseId);
      })
      .addCase(logout, () => initialState);
  },
});

export default assignmentsSlice.reducer;

export const selectAllAssignments = (state) => state.assignments.assignments;
export const selectAssignmentsStatus = (state) => state.assignments.status;
export const selectAssignmentsByClass = (state, classId) => state.assignments.assignments.filter((a) => a.classId === classId);
export const selectAssignmentsByCourse = (state, courseId) => state.assignments.assignments.filter((a) => a.courseId === courseId);

// True if submissions are closed — either the trainer closed it manually, or
// it's set to auto-close and the due date has passed.
export function isAssignmentClosed(assignment) {
  if (!assignment) return false;
  if (assignment.status === "closed") return true;
  return !!assignment.autoCloseOnDueDate && !!assignment.dueDate && new Date(assignment.dueDate) < new Date();
}
