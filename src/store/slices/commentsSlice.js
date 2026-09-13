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
      prepare({ courseId, topicId, userId, text }) {
        return {
          payload: {
            id: `cmt-${nanoid(6)}`,
            courseId,
            topicId,
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

export const selectCommentsForTopic = (state, courseId, topicId) =>
  state.comments.comments
    .filter((c) => c.courseId === courseId && c.topicId === topicId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
