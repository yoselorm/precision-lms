import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { apiThunk, guardOf } from "../apiThunk";
import { logout } from "./authSlice";

const initialState = {
  // Server-side aggregates. The shape depends on who asked: the admin
  // platform summary, a trainer summary, or a learner summary.
  stats: null,
  status: "idle",
};

export const fetchDashboard = apiThunk("dashboard/fetch", (_, { getState }) => api.getDashboard(guardOf(getState)));

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stats = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(logout, () => initialState);
  },
});

export default dashboardSlice.reducer;

export const selectDashboardStats = (state) => state.dashboard.stats;
