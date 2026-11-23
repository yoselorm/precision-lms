import { apiRequest, fetchAllPages, toQuery } from "./client";

// Admins hit /v1/admin/*, learners and trainers /v1/user/*. Most course
// routes exist on both sides with the same shape.
const base = (guard) => (guard === "admin" ? "/v1/admin" : "/v1/user");

// Admin: every course in every status. Users: the approved catalog, or with
// `mine` the trainer's own courses in any status.
export function listCourses(guard, { mine } = {}) {
  return fetchAllPages(`${base(guard)}/courses`, guard === "admin" ? {} : { mine: mine ? 1 : undefined });
}

// The public catalog — approved courses only, no sign-in needed.
export function listPublicCourses() {
  return fetchAllPages("/v1/courses", {}, { auth: false });
}

// One approved course from the public catalog (404 otherwise).
export function getPublicCourse(id) {
  return apiRequest(`/v1/courses/${id}`, { auth: false });
}

export function getCourse(guard, id) {
  return apiRequest(`${base(guard)}/courses/${id}`);
}

// `created_by` (the trainer who builds it) is only accepted from admins;
// trainers always own what they create.
export function createCourse(guard, body) {
  return apiRequest(`${base(guard)}/courses`, { method: "POST", body });
}

export function updateCourse(guard, id, body) {
  return apiRequest(`${base(guard)}/courses/${id}`, { method: "PATCH", body });
}

export function deleteCourse(id) {
  return apiRequest(`/v1/admin/courses/${id}`, { method: "DELETE" });
}

// Admin approve/deny; a denial needs a reason.
export function reviewCourse(id, status, reason) {
  return apiRequest(`/v1/admin/courses/${id}/status`, { method: "PATCH", body: { status, reason: reason || null } });
}

export function setCourseOwner(id, trainerId) {
  return apiRequest(`/v1/admin/courses/${id}/owner`, { method: "PATCH", body: { created_by: trainerId } });
}

// Trainer: draft/denied -> pending.
export function submitCourse(id) {
  return apiRequest(`/v1/user/courses/${id}/submit`, { method: "POST" });
}

// ── Topics & lessons ──
// For a trainer this is the course's *editable* container: the course itself
// while draft/denied, or its open revision once approved (422 otherwise).
export function listTopics(guard, courseId) {
  return apiRequest(`${base(guard)}/courses/${courseId}/topics`);
}

// Read-only content for taking a course: enrolled learners and the owning
// trainer (403 for anyone else). Topics with their lessons, live version.
export function getCourseContent(courseId) {
  return apiRequest(`/v1/user/courses/${courseId}/content`);
}

export function createTopic(guard, courseId, body) {
  return apiRequest(`${base(guard)}/courses/${courseId}/topics`, { method: "POST", body });
}

export function deleteTopic(guard, topicId) {
  return apiRequest(`${base(guard)}/topics/${topicId}`, { method: "DELETE" });
}

// Partial updates — also used with just { sort_order } to reorder.
export function updateTopic(guard, topicId, body) {
  return apiRequest(`${base(guard)}/topics/${topicId}`, { method: "PATCH", body });
}

export function updateLesson(guard, lessonId, body) {
  return apiRequest(`${base(guard)}/lessons/${lessonId}`, { method: "PATCH", body });
}

export function createLesson(guard, topicId, body) {
  return apiRequest(`${base(guard)}/topics/${topicId}/lessons`, { method: "POST", body });
}

export function deleteLesson(guard, lessonId) {
  return apiRequest(`${base(guard)}/lessons/${lessonId}`, { method: "DELETE" });
}

// ── Topic quizzes ──
// Only the user-side read exists, and it never includes correct answers.
export function getTopicQuiz(topicId) {
  return apiRequest(`/v1/user/topics/${topicId}/quiz`);
}

// Full replace — the backend deletes any existing quiz first.
// Admin: every quiz in the system (topic and class quizzes), with answers.
// Each names its owner only by type + id. Loading several courses at once
// would each ask for this list, so concurrent calls share one request.
let adminQuizzesInFlight = null;
export function listAdminQuizzes() {
  if (!adminQuizzesInFlight) {
    adminQuizzesInFlight = apiRequest("/v1/admin/quizzes").finally(() => (adminQuizzesInFlight = null));
  }
  return adminQuizzesInFlight;
}

// Quizzes can belong to a course, a topic or a lesson — owner is
// { type: "course" | "topic" | "lesson", id }. Course and lesson quizzes
// follow the same routes as topic quizzes (/courses|/topics|/lessons/{id}/quiz).
const QUIZ_OWNER_PATH = { course: "courses", topic: "topics", lesson: "lessons" };
const quizPath = (guard, owner) => `${base(guard)}/${QUIZ_OWNER_PATH[owner.type]}/${owner.id}/quiz`;

// User-side read: learner view, or with answers for the owning trainer.
export function getQuiz(owner) {
  return apiRequest(quizPath("user", owner));
}

export function saveQuiz(guard, owner, body) {
  return apiRequest(quizPath(guard, owner), { method: "PUT", body });
}

export function deleteQuiz(guard, owner) {
  return apiRequest(quizPath(guard, owner), { method: "DELETE" });
}

export function saveTopicQuiz(guard, topicId, body) {
  return apiRequest(`${base(guard)}/topics/${topicId}/quiz`, { method: "PUT", body });
}

export function deleteTopicQuiz(guard, topicId) {
  return apiRequest(`${base(guard)}/topics/${topicId}/quiz`, { method: "DELETE" });
}

// ── Revisions (trainer edits to a live course) ──
export function getCurrentRevision(courseId) {
  return apiRequest(`/v1/user/courses/${courseId}/revisions/current`);
}

// Idempotent — returns the open revision if there already is one.
export function startRevision(courseId) {
  return apiRequest(`/v1/user/courses/${courseId}/revisions`, { method: "POST" });
}

export function submitRevision(courseId, revisionId) {
  return apiRequest(`/v1/user/courses/${courseId}/revisions/${revisionId}/submit`, { method: "POST" });
}

export function discardRevision(courseId, revisionId) {
  return apiRequest(`/v1/user/courses/${courseId}/revisions/${revisionId}`, { method: "DELETE" });
}

// Admin: course updates across every course — `status: "pending"` for the
// ones awaiting review. Each includes its course and full topics.
export function listCourseRevisions(status) {
  return apiRequest(`/v1/admin/course-revisions${toQuery({ status })}`);
}

export function reviewRevision(courseId, revisionId, status, reason) {
  return apiRequest(`/v1/admin/courses/${courseId}/revisions/${revisionId}/review`, {
    method: "POST",
    body: { status, reason: reason || null },
  });
}
