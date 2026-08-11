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
      prepare({ classId, title, instructions, dueDate }) {
        return {
          payload: {
            id: `asg-${nanoid(6)}`,
            classId,
            title,
            instructions: instructions || "",
            dueDate,
            createdAt: new Date().toISOString().slice(0, 10),
          },
        };
      },
    },
  },
});

export const { addAssignment } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;

export const selectAllAssignments = (state) => state.assignments.assignments;
export const selectAssignmentsByClass = (state, classId) =>
  state.assignments.assignments.filter((a) => a.classId === classId);
