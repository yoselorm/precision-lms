import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../api/auth";
import { normalizeUser } from "../../api/normalize";

// No default logged-in user anymore — the app opens signed out so the
// public catalog / course pages are what an anonymous visitor sees first.
const initialState = {
  currentUser: null,
  viewingAsRole: null,
  isAuthenticated: false,
  // Set while an admin is "previewing" another role from the sidebar —
  // holds their real account so they can hop back to it. Distinct from
  // currentUser, which is whichever identity is currently being viewed.
  realUser: null,
  // Sanctum bearer token + which guard issued it ("user" or "admin"), so
  // /me and /logout hit the matching endpoints.
  token: null,
  guard: null,
  // While an admin previews another user: the admin's own session (restored
  // on exit) and the impersonation token's id (revoked on exit).
  realSession: null,
  impersonationTokenId: null,
};

export const loginUser = createAsyncThunk("auth/loginUser", async ({ email, password, portal }, { rejectWithValue }) => {
  try {
    return await authApi.login(email, password, portal);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const registerUser = createAsyncThunk("auth/registerUser", async (form, { rejectWithValue }) => {
  try {
    return await authApi.register(form);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Re-validates a persisted token on app start and refreshes the user record
// (status may have changed, e.g. a trainer got approved). A 401 is handled by
// the API client's unauthorized hook, which clears the session.
export const restoreSession = createAsyncThunk("auth/restoreSession", async (_, { getState }) => {
  const { guard } = getState().auth;
  const user = await authApi.fetchMe(guard);
  return { user, guard };
});

// Ends an active preview: revokes the impersonation token (best effort) and
// hands back the admin's session.
async function endImpersonation(auth) {
  if (!auth.realSession) return;
  await authApi.stopImpersonation(auth.impersonationTokenId, auth.realSession.token).catch(() => {});
}

// Clear local state even if the server call fails — the user asked to leave.
export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { getState, dispatch }) => {
  const auth = getState().auth;
  dispatch(logout());
  await endImpersonation(auth);
  const { guard, token } = auth.realSession || auth;
  if (token) await authApi.logout(guard, token).catch(() => {});
});

// Admin-only "preview as" through the API's impersonation endpoint, so the
// app really runs as that user. Switching from one preview to another ends
// the first.
export const startPreview = createAsyncThunk("auth/startPreview", async ({ userId }, { getState, rejectWithValue }) => {
  const auth = getState().auth;
  const adminToken = auth.realSession?.token ?? auth.token;
  try {
    await endImpersonation(auth);
    return await authApi.impersonate(userId, adminToken);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const stopPreview = createAsyncThunk("auth/stopPreview", async (_, { getState }) => {
  await endImpersonation(getState().auth);
});

function applySession(state, { user, token, guard }) {
  state.currentUser = normalizeUser(user, guard);
  state.viewingAsRole = state.currentUser?.role ?? null;
  state.isAuthenticated = true;
  state.realUser = null;
  state.token = token;
  state.guard = guard;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => applySession(state, action.payload))
      .addCase(registerUser.fulfilled, (state, action) => {
        // Pending trainers get no token — leave them signed out.
        if (action.payload.token) applySession(state, action.payload);
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        // The token's own identity — the previewed user during a preview.
        const user = normalizeUser(action.payload.user, action.payload.guard);
        state.currentUser = user;
        state.viewingAsRole = user.role;
      })
      .addCase(startPreview.fulfilled, (state, action) => {
        const { user, token, tokenId } = action.payload;
        if (!state.realSession) {
          state.realSession = { token: state.token, guard: state.guard, user: state.currentUser };
        }
        // realUser drives the "Previewing as… / Exit" UI.
        state.realUser = state.realSession.user;
        state.currentUser = normalizeUser(user, "user");
        state.viewingAsRole = state.currentUser.role;
        state.token = token;
        state.guard = "user";
        state.impersonationTokenId = tokenId;
      })
      .addCase(stopPreview.fulfilled, (state) => {
        if (!state.realSession) return;
        const { token, guard, user } = state.realSession;
        state.token = token;
        state.guard = guard;
        state.currentUser = user;
        state.viewingAsRole = user.role;
        state.realUser = null;
        state.realSession = null;
        state.impersonationTokenId = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectViewingAsRole = (state) => state.auth.viewingAsRole;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectRealUser = (state) => state.auth.realUser;
export const selectAuthToken = (state) => state.auth.token;
