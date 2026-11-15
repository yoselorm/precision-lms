import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeComment } from "../../api/normalize";
import { apiThunk } from "../apiThunk";
import { logout } from "./authSlice";

const initialState = {
  comments: [],
};

export const fetchComments = apiThunk("comments/fetch", async ({ topicId }) => ({
  topicId,
  comments: await api.listComments(topicId),
}));

// Only allowed on topics of a published course.
export const addComment = apiThunk("comments/create", ({ topicId, text }) => api.postComment(topicId, text));

export const removeComment = apiThunk("comments/delete", async (id) => {
  await api.deleteComment(id);
  return id;
});

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { topicId, comments } = action.payload;
        state.comments = [...state.comments.filter((c) => c.topicId !== topicId), ...comments.map(normalizeComment)];
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(normalizeComment(action.payload));
      })
      .addCase(removeComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c.id !== action.payload);
      })
      .addCase(logout, () => initialState);
  },
});

export default commentsSlice.reducer;

// courseId is unused now that topic ids are globally unique — kept so
// callers don't change.
export const selectCommentsForTopic = (state, courseId, topicId) =>
  state.comments.comments
    .filter((c) => c.topicId === topicId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
