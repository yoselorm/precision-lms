import { createSlice } from "@reduxjs/toolkit";

// No default logged-in user anymore — the app opens signed out so the
// public catalog / course pages are what an anonymous visitor sees first.
const initialState = {
  currentUser: null,
  viewingAsRole: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Accepts a full user object (from the live users list, or the object
    // just created by usersSlice.addUser on signup) rather than an id, so
    // this works for both seeded demo personas and freshly signed-up users.
    login(state, action) {
      state.currentUser = action.payload;
      state.viewingAsRole = action.payload?.role ?? null;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.currentUser = null;
      state.viewingAsRole = null;
      state.isAuthenticated = false;
    },
    switchDemoUser(state, action) {
      state.currentUser = action.payload;
      state.viewingAsRole = action.payload?.role ?? null;
    },
  },
});

export const { login, logout, switchDemoUser } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectViewingAsRole = (state) => state.auth.viewingAsRole;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
