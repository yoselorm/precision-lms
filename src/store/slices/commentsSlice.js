import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockComments } from "../../data/mockData";

const initialState = {
  comments: mockComments,
};

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    addComment: {
      reducer(state, action) {
        state.comments.push(action.payload);
      },
      prepare({ courseId, moduleId, userId, text }) {
        return {
          payload: {
            id: `cmt-${nanoid(6)}`,
            courseId,
            moduleId,
            userId,
            text,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    removeComment(state, action) {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addComment, removeComment } = commentsSlice.actions;
export default commentsSlice.reducer;

export const selectCommentsForModule = (state, courseId, moduleId) =>
  state.comments.comments
    .filter((c) => c.courseId === courseId && c.moduleId === moduleId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
