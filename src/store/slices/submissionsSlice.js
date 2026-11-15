import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeSubmission } from "../../api/normalize";
import { apiThunk } from "../apiThunk";
import { logout } from "./authSlice";

const initialState = {
  // Trainers load every submission for an assignment they own. Learners
  // only see the ones they upload this session — the API has no "my
  // submissions" list yet.
  submissions: [],
};

export const fetchSubmissions = apiThunk("submissions/fetch", async ({ assignmentId }) => ({
  assignmentId,
  submissions: await api.listSubmissions(assignmentId),
}));

// Resubmitting replaces the caller's previous file server-side.
export const addSubmission = apiThunk("submissions/create", ({ refId, file }) => api.submitAssignment(refId, file));

export const gradeSubmission = apiThunk("submissions/grade", ({ id, grade, feedback }) => api.gradeSubmission(id, grade, feedback));

function upsert(state, apiSubmission) {
  const incoming = normalizeSubmission(apiSubmission);
  state.submissions = state.submissions.filter(
    (s) => s.id !== incoming.id && !(s.refId === incoming.refId && s.userId && s.userId === incoming.userId)
  );
  state.submissions.push(incoming);
}

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        const { assignmentId, submissions } = action.payload;
        state.submissions = [
          ...state.submissions.filter((s) => s.refId !== assignmentId),
          ...submissions.map(normalizeSubmission),
        ];
      })
      .addCase(addSubmission.fulfilled, (state, action) => {
        // The upload response may omit the user — it's the caller.
        upsert(state, action.payload);
        const sub = state.submissions[state.submissions.length - 1];
        if (!sub.userId) sub.userId = action.meta.arg.userId;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(logout, () => initialState);
  },
});

export default submissionsSlice.reducer;

export const selectAllSubmissions = (state) => state.submissions.submissions;
export const selectSubmissionsForTarget = (state, type, refId) => state.submissions.submissions.filter((s) => s.refId === refId);
export const selectSubmissionForUser = (state, type, refId, userId) =>
  state.submissions.submissions.find((s) => s.refId === refId && s.userId === userId);
export const selectSubmissionsByUser = (state, userId) => state.submissions.submissions.filter((s) => s.userId === userId);
