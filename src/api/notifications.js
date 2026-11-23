import { apiRequest, toQuery } from "./client";

// The signed-in account's own notifications — the same routes and shape on
// the admin and user sides. Each has an id, read_at, created_at, a `type`
// (e.g. "certificate_issued"), a ready-to-show `message`, and whatever
// extra fields that type carries (course_id, verification_code, ...).
const base = (guard) => (guard === "admin" ? "/v1/admin" : "/v1/user");

// Most recent first. Resolves to the whole envelope ({ data, meta }).
export function listNotifications(guard, { limit = 20, page = 1, unreadOnly = false } = {}) {
  return apiRequest(`${base(guard)}/notifications${toQuery({ limit, page, unread_only: unreadOnly ? 1 : undefined })}`, { raw: true });
}

export function getUnreadCount(guard) {
  return apiRequest(`${base(guard)}/notifications/unread-count`);
}

export function markNotificationRead(guard, id) {
  return apiRequest(`${base(guard)}/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(guard) {
  return apiRequest(`${base(guard)}/notifications/read-all`, { method: "POST" });
}
