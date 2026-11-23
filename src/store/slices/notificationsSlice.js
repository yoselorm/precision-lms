import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/notifications";
import { normalizeNotification } from "../../api/normalize";
import { apiThunk, guardOf } from "../apiThunk";
import { logout, startPreview, stopPreview } from "./authSlice";

const PAGE_SIZE = 20;

const initialState = {
  // The latest page(s) of the signed-in account's notifications.
  items: [],
  page: 0,
  lastPage: 1,
  unreadCount: 0,
  status: "idle",
};

// First page, or the next one with `more`.
export const fetchNotifications = apiThunk("notifications/fetch", async ({ more = false } = {}, { getState }) => {
  const { page } = getState().notifications;
  const nextPage = more ? page + 1 : 1;
  const json = await api.listNotifications(guardOf(getState), { limit: PAGE_SIZE, page: nextPage });
  return { items: json?.data || [], page: nextPage, lastPage: json?.meta?.last_page ?? nextPage, more };
});

export const fetchUnreadCount = apiThunk("notifications/fetchUnreadCount", async (_, { getState }) => {
  const data = await api.getUnreadCount(guardOf(getState));
  return data?.unread_count ?? 0;
});

export const markNotificationRead = apiThunk("notifications/markRead", async ({ id }, { getState }) => {
  await api.markNotificationRead(guardOf(getState), id);
  return { id };
});

export const markAllNotificationsRead = apiThunk("notifications/markAllRead", async (_, { getState }) => {
  await api.markAllNotificationsRead(guardOf(getState));
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { items, page, lastPage, more } = action.payload;
        const incoming = items.map(normalizeNotification);
        if (more) {
          const known = new Set(state.items.map((n) => n.id));
          state.items.push(...incoming.filter((n) => !known.has(n.id)));
        } else state.items = incoming;
        state.page = page;
        state.lastPage = lastPage;
        state.status = "succeeded";
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Optimistic: shown as read straight away.
      .addCase(markNotificationRead.pending, (state, action) => {
        const item = state.items.find((n) => n.id === action.meta.arg.id);
        if (item && !item.readAt) {
          item.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        const now = new Date().toISOString();
        state.items.forEach((n) => {
          if (!n.readAt) n.readAt = now;
        });
        state.unreadCount = 0;
      })
      // Another account's notifications don't carry over.
      .addCase(startPreview.fulfilled, () => initialState)
      .addCase(stopPreview.fulfilled, () => initialState)
      .addCase(logout, () => initialState);
  },
});

export default notificationsSlice.reducer;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsStatus = (state) => state.notifications.status;
export const selectHasMoreNotifications = (state) => state.notifications.page < state.notifications.lastPage;
