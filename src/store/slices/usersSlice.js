import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { register } from "../../api/auth";
import { normalizeUser } from "../../api/normalize";
import { apiThunk } from "../apiThunk";
import { logout } from "./authSlice";

const initialState = {
  // Learners and trainers — only admins can list them (GET /admin/users),
  // so this stays empty for everyone else.
  users: [],
  status: "idle",
};

export const fetchUsers = apiThunk("users/fetch", () => api.listUsers());

export const updateUserRole = apiThunk("users/setRole", ({ userId, role }) => api.setUserRole(userId, role));

// There's no admin "create user" endpoint, so admins add people through
// the public sign-up route; trainers are then approved straight away (they
// sign up as pending). Doesn't touch the admin's own session.
export const createUser = apiThunk("users/create", async ({ name, email, password, department, role }, { dispatch }) => {
  const { user } = await register({ name, email, password, role, department });
  if (role === "trainer" && user.status !== "approved") await api.setUserStatus(user.id, "approved");
  await dispatch(fetchUsers());
  return user;
});

// Approving/denying a trainer also emails them (server-side).
export const setUserStatus = apiThunk("users/setStatus", ({ userId, status }) => api.setUserStatus(userId, status));

function replace(state, apiUser) {
  const user = normalizeUser(apiUser);
  const index = state.users.findIndex((u) => u.id === user.id);
  if (index === -1) state.users.push(user);
  else state.users[index] = user;
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload.map((u) => normalizeUser(u));
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(updateUserRole.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(setUserStatus.fulfilled, (state, action) => replace(state, action.payload))
      .addCase(logout, () => initialState);
  },
});

export default usersSlice.reducer;

export const selectAllUsers = (state) => state.users.users;
export const selectUsersStatus = (state) => state.users.status;
export const selectUserById = (state, userId) =>
  state.users.users.find((u) => u.id === userId) || (state.auth.currentUser?.id === userId ? state.auth.currentUser : undefined);
export const selectUserByEmail = (state, email) =>
  state.users.users.find((u) => (u.email || "").toLowerCase() === (email || "").toLowerCase());
export const selectTeamByManager = (state, managerId) => state.users.users.filter((u) => u.managerId === managerId);
export const selectTrainers = (state) => state.users.users.filter((u) => u.role === "trainer");
export const selectApprovedTrainers = (state) =>
  state.users.users.filter((u) => u.role === "trainer" && u.status === "approved");
export const selectPendingTrainers = (state) =>
  state.users.users.filter((u) => u.role === "trainer" && u.status === "pending");
export const selectLearners = (state) => state.users.users.filter((u) => u.role === "learner");
