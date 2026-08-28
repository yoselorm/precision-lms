import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockAssignments } from "../../data/mockData";

const initialState = {
  assignments: mockAssignments,
};

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    addAssignment: {
      reducer(state, action) {
        state.assignments.push(action.payload);
      },
      prepare({ classId, title, instructions, dueDate, autoCloseOnDueDate }) {
        return {
          payload: {
            id: `asg-${nanoid(6)}`,
            classId,
            title,
            instructions: instructions || "",
            dueDate,
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
      if (dueDate !== undefined) assignment.dueDate = dueDate;
      if (autoCloseOnDueDate !== undefined) assignment.autoCloseOnDueDate = !!autoCloseOnDueDate;
    },
    // Manual close/reopen toggle — independent of the auto-close-on-due-date
    // preference, so a trainer can always override either direction.
    setAssignmentStatus(state, action) {
      const { id, status } = action.payload;
      const assignment = state.assignments.find((a) => a.id === id);
      if (assignment) assignment.status = status;
    },
  },
});

export const { addAssignment, updateAssignment, setAssignmentStatus } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;

export const selectAllAssignments = (state) => state.assignments.assignments;
export const selectAssignmentsByClass = (state, classId) =>
  state.assignments.assignments.filter((a) => a.classId === classId);

// True if submissions are closed — either the trainer closed it manually, or
// it's set to auto-close and the due date has passed. Mirrors the isOverdue
// helper in StatusBadge.jsx.
export function isAssignmentClosed(assignment) {
  if (!assignment) return false;
  if (assignment.status === "closed") return true;
  return !!assignment.autoCloseOnDueDate && new Date(assignment.dueDate) < new Date();
}
