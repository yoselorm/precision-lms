import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockAssignments } from "../../data/mockData";
import { removeCourse } from "./coursesSlice";

const initialState = {
  assignments: mockAssignments,
};

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    // An assignment belongs to either a class (classId) or a course
    // (courseId) — never both. Created from the Assignments page.
    addAssignment: {
      reducer(state, action) {
        state.assignments.push(action.payload);
      },
      prepare({ classId, courseId, title, instructions, dueDate, autoCloseOnDueDate }) {
        return {
          payload: {
            id: `asg-${nanoid(6)}`,
            classId: classId || null,
            courseId: courseId || null,
            title,
            instructions: instructions || "",
            dueDate: dueDate || null,
            createdAt: new Date().toISOString().slice(0, 10),
            status: "open",
            autoCloseOnDueDate: !!autoCloseOnDueDate,
          },
        };
      },
    },
    // Trainer/admin editing an assignment they already set — title,
    // instructions, due date, and the auto-close preference.
    updateAssignment(state, action) {
      const { id, title, instructions, dueDate, autoCloseOnDueDate } = action.payload;
      const assignment = state.assignments.find((a) => a.id === id);
      if (!assignment) return;
      if (title !== undefined) assignment.title = title;
      if (instructions !== undefined) assignment.instructions = instructions;
      if (dueDate !== undefined) assignment.dueDate = dueDate || null;
      if (autoCloseOnDueDate !== undefined) assignment.autoCloseOnDueDate = !!autoCloseOnDueDate;
    },
    // Manual close/reopen toggle — independent of the auto-close-on-due-date
    // preference, so a trainer can always override either direction.
    setAssignmentStatus(state, action) {
      const { id, status } = action.payload;
      const assignment = state.assignments.find((a) => a.id === id);
      if (assignment) assignment.status = status;
    },
    removeAssignment(state, action) {
      state.assignments = state.assignments.filter((a) => a.id !== action.payload.id);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(removeCourse, (state, action) => {
      state.assignments = state.assignments.filter((a) => a.courseId !== action.payload.courseId);
    });
  },
});

export const { addAssignment, updateAssignment, setAssignmentStatus, removeAssignment } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;

export const selectAllAssignments = (state) => state.assignments.assignments;
export const selectAssignmentsByClass = (state, classId) =>
  state.assignments.assignments.filter((a) => a.classId === classId);
export const selectAssignmentsByCourse = (state, courseId) =>
  state.assignments.assignments.filter((a) => a.courseId === courseId);

// True if submissions are closed — either the trainer closed it manually, or
// it's set to auto-close and the due date has passed.
export function isAssignmentClosed(assignment) {
  if (!assignment) return false;
  if (assignment.status === "closed") return true;
  return !!assignment.autoCloseOnDueDate && !!assignment.dueDate && new Date(assignment.dueDate) < new Date();
}
