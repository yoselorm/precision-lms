import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  // Seeded empty — in a real backend this would hold uploaded file
  // references. Here fileUrl is a browser object URL, so it only survives
  // for the current session (dies on refresh) — that's a known demo limit.
  submissions: [],
};

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    addSubmission: {
      reducer(state, action) {
        // Replace an existing submission from the same user for the same
        // target instead of stacking duplicates — resubmitting overwrites.
        const { type, refId, userId } = action.payload;
        state.submissions = state.submissions.filter(
          (s) => !(s.type === type && s.refId === refId && s.userId === userId)
        );
        state.submissions.push(action.payload);
      },
      prepare({ type, refId, userId, fileName, fileSize, fileUrl }) {
        return {
          payload: {
            id: `sub-${nanoid(6)}`,
            type, // "assignment" | "capstone"
            refId, // assignmentId or courseId
            userId,
            fileName,
            fileSize,
            fileUrl,
            submittedAt: new Date().toISOString(),
            status: "submitted",
          },
        };
      },
    },
  },
});

export const { addSubmission } = submissionsSlice.actions;
export default submissionsSlice.reducer;

export const selectAllSubmissions = (state) => state.submissions.submissions;
export const selectSubmissionsForTarget = (state, type, refId) =>
  state.submissions.submissions.filter((s) => s.type === type && s.refId === refId);
export const selectSubmissionForUser = (state, type, refId, userId) =>
  state.submissions.submissions.find((s) => s.type === type && s.refId === refId && s.userId === userId);
export const selectSubmissionsByUser = (state, userId) =>
  state.submissions.submissions.filter((s) => s.userId === userId);
