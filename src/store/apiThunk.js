import { createAsyncThunk } from "@reduxjs/toolkit";

// createAsyncThunk whose failures reject with the server's message (pages
// show it in a toast or inline) and the HTTP status for callers that branch
// on it.
export const apiThunk = (type, fn) =>
  createAsyncThunk(type, async (arg, thunkApi) => {
    try {
      return await fn(arg, thunkApi);
    } catch (err) {
      return thunkApi.rejectWithValue(err.message || "Something went wrong.");
    }
  });

// For argument-less list fetches that several places ask for (app startup
// and each page that shows the list): while one request is in flight, later
// dispatches share it instead of firing a duplicate, and resolve when it
// does — so callers can still `await` fresh data. Exposes the same
// pending/fulfilled/rejected action creators as a normal thunk.
export const listThunk = (type, fn) => {
  const thunk = apiThunk(type, fn);
  let inFlight = null;
  const shared = () => (dispatch) => {
    if (!inFlight) inFlight = dispatch(thunk()).finally(() => (inFlight = null));
    return inFlight;
  };
  return Object.assign(shared, {
    pending: thunk.pending,
    fulfilled: thunk.fulfilled,
    rejected: thunk.rejected,
    typePrefix: thunk.typePrefix,
  });
};

// Current guard ("admin" | "user") from the auth slice — decides which side
// of the API a call goes to.
export const guardOf = (getState) => getState().auth.guard;
export const roleOf = (getState) => getState().auth.currentUser?.role;

// Dispatches a thunk and returns its payload, or throws its error message —
// lets pages write `try { await run(dispatch, thunk(arg)) } catch (msg) {...}`.
export async function run(dispatch, action) {
  const result = await dispatch(action);
  if (result.error) throw result.payload || result.error.message;
  return result.payload;
}
