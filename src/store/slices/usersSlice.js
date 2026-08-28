import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockUsers } from "../../data/mockData";

const AVATAR_POOL = [2, 5, 8, 15, 20, 22, 27, 33, 36, 40, 44, 50, 56, 60, 65];

const initialState = {
  users: mockUsers,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUser: {
      reducer(state, action) {
        state.users.push(action.payload);
      },
      prepare({ name, email, password, department, role, managerId, status }) {
        const avatarSeed = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
        return {
          payload: {
            id: `u-${nanoid(6)}`,
            name,
            email: email || "",
            password: password || "",
            department,
            role,
            managerId: managerId || null,
            avatarColor: "#57534e",
            avatarUrl: `https://i.pravatar.cc/150?img=${avatarSeed}`,
            points: 0,
            streakDays: 0,
            // Learners/admins are active immediately. Trainer signups sit as
            // "pending" until an admin approves them.
            status: status || (role === "trainer" ? "pending" : "approved"),
          },
        };
      },
    },
    updateUserRole(state, action) {
      const { userId, role } = action.payload;
      const user = state.users.find((u) => u.id === userId);
      if (user) user.role = role;
    },
    setUserStatus(state, action) {
      const { userId, status } = action.payload;
      const user = state.users.find((u) => u.id === userId);
      if (user) user.status = status;
    },
  },
});

export const { addUser, updateUserRole, setUserStatus } = usersSlice.actions;
export default usersSlice.reducer;

export const selectAllUsers = (state) => state.users.users;
export const selectUserById = (state, userId) => state.users.users.find((u) => u.id === userId);
export const selectUserByEmail = (state, email) =>
  state.users.users.find((u) => (u.email || "").toLowerCase() === (email || "").toLowerCase());
export const selectTeamByManager = (state, managerId) =>
  state.users.users.filter((u) => u.managerId === managerId);
export const selectTrainers = (state) => state.users.users.filter((u) => u.role === "trainer");
export const selectApprovedTrainers = (state) =>
  state.users.users.filter((u) => u.role === "trainer" && (u.status || "approved") === "approved");
export const selectPendingTrainers = (state) =>
  state.users.users.filter((u) => u.role === "trainer" && u.status === "pending");
export const selectLearners = (state) => state.users.users.filter((u) => u.role === "learner");
