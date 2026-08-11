import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockClasses } from "../../data/mockData";

const initialState = {
  classes: mockClasses,
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
  },
});

export const { addClass, setClassCourse } = classesSlice.actions;
export default classesSlice.reducer;

export const selectAllClasses = (state) => state.classes.classes;
export const selectClassById = (state, classId) => state.classes.classes.find((c) => c.id === classId);
export const selectClassesForUser = (state, userId) =>
  state.classes.classes.filter((c) => c.memberIds.includes(userId));
export const selectClassesByTrainer = (state, trainerId) =>
  state.classes.classes.filter((c) => c.trainerId === trainerId);
