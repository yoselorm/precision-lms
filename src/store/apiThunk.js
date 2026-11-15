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
