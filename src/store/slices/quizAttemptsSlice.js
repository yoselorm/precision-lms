import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeQuizAttempts } from "../../api/normalize";
import { apiThunk } from "../apiThunk";
import { logout, startPreview, stopPreview } from "./authSlice";

// The signed-in learner's past attempts per quiz, from the server, keyed by
// owner ("topic:<id>", "lesson:<id>", "course:<id>", "class:<id>").
// Each list is oldest first: { id, score, passed, submittedAt }.
export const attemptKey = (owner) => `${owner.type}:${owner.id}`;

const initialState = { byKey: {} };

export const fetchQuizAttempts = apiThunk("quizAttempts/fetch", async ({ owner }) => ({
  key: attemptKey(owner),
  attempts: normalizeQuizAttempts(await api.listQuizAttempts(owner)),
}));

const quizAttemptsSlice = createSlice({
  name: "quizAttempts",
  initialState,
  reducers: {
    // Shown straight away after submitting; the next fetch replaces it with
    // the server's record.
    recordAttempt(state, action) {
      const { owner, score, passed } = action.payload;
      const key = attemptKey(owner);
      const list = state.byKey[key] || (state.byKey[key] = { items: [], status: "idle" });
      list.items.push({ id: `local-${Date.now()}`, score, passed: !!passed, submittedAt: new Date().toISOString() });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizAttempts.pending, (state, action) => {
        const key = attemptKey(action.meta.arg.owner);
        state.byKey[key] = { items: state.byKey[key]?.items || [], status: "loading" };
      })
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.byKey[action.payload.key] = { items: action.payload.attempts, status: "succeeded" };
      })
      .addCase(fetchQuizAttempts.rejected, (state, action) => {
        const key = attemptKey(action.meta.arg.owner);
        if (state.byKey[key]) state.byKey[key].status = "failed";
      })
      .addCase(startPreview.fulfilled, () => initialState)
      .addCase(stopPreview.fulfilled, () => initialState)
      .addCase(logout, () => initialState);
  },
});

export const { recordAttempt } = quizAttemptsSlice.actions;
export default quizAttemptsSlice.reducer;

const NO_ATTEMPTS = [];
export const selectQuizAttempts = (state, owner) => (owner ? state.quizAttempts.byKey[attemptKey(owner)]?.items ?? NO_ATTEMPTS : NO_ATTEMPTS);
