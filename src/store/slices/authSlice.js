import { createSlice } from "@reduxjs/toolkit";

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
};

// Strip the password before it ever lands in Redux state (and therefore
// localStorage) — the users list still has it for login checks, but nothing
// about "who's currently signed in" should carry the plaintext around.
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Accepts a full user object (from the live users list, or the object
    // just created by usersSlice.addUser on signup) rather than an id, so
    // this works for both seeded demo personas and freshly signed-up users.
    login(state, action) {
      state.currentUser = sanitizeUser(action.payload);
      state.viewingAsRole = action.payload?.role ?? null;
      state.isAuthenticated = true;
      state.realUser = null;
    },
    logout(state) {
      state.currentUser = null;
      state.viewingAsRole = null;
      state.isAuthenticated = false;
      state.realUser = null;
    },
    // Admin-only "preview as" — keeps the admin's real identity in realUser
    // (captured once, on the first switch) so they can always get back.
    switchDemoUser(state, action) {
      if (!state.realUser) state.realUser = state.currentUser;
      state.currentUser = sanitizeUser(action.payload);
      state.viewingAsRole = action.payload?.role ?? null;
    },
    stopPreview(state) {
      if (!state.realUser) return;
      state.currentUser = state.realUser;
      state.viewingAsRole = state.realUser.role;
      state.realUser = null;
    },
  },
});

export const { login, logout, switchDemoUser, stopPreview } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectViewingAsRole = (state) => state.auth.viewingAsRole;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectRealUser = (state) => state.auth.realUser;
