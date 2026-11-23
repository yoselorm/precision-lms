import { apiRequest, toQuery } from "./client";

// Course ratings & reviews: 1–5 stars plus an optional review (max 2000
// characters). Learners can rate a course once they've completed it.

// Public — no sign-in needed. Most recent first; resolves to { data, meta }.
export function listCourseRatings(courseId, { limit = 20, page = 1 } = {}) {
  return apiRequest(`/v1/courses/${courseId}/ratings${toQuery({ limit, page })}`, { raw: true, auth: false });
}

// The caller's own rating for a course (404 if they haven't left one).
export function getMyRating(courseId) {
  return apiRequest(`/v1/user/courses/${courseId}/rating`);
}

// Creates or replaces it. 422 until the course is completed.
export function saveMyRating(courseId, { rating, review }) {
  return apiRequest(`/v1/user/courses/${courseId}/rating`, { method: "PUT", body: { rating, review: review?.trim() || null } });
}

export function deleteMyRating(courseId) {
  return apiRequest(`/v1/user/courses/${courseId}/rating`, { method: "DELETE" });
}

// ── Admin moderation ──
export function listAllRatings({ courseId, limit = 50, page = 1 } = {}) {
  return apiRequest(`/v1/admin/ratings${toQuery({ course_id: courseId, limit, page })}`, { raw: true });
}

export function deleteRating(id) {
  return apiRequest(`/v1/admin/ratings/${id}`, { method: "DELETE" });
}
