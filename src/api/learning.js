import { apiRequest, fetchAllPages, toQuery } from "./client";

// Everything a signed-in learner/trainer does around courses: users,
// enrollments, classes, assignments, submissions, comments, quiz attempts,
// certificates and dashboards.
const base = (guard) => (guard === "admin" ? "/v1/admin" : "/v1/user");

// ── Users (admin) ──
export function listUsers() {
  return fetchAllPages("/v1/admin/users");
}

export function setUserRole(id, role) {
  return apiRequest(`/v1/admin/users/${id}/role`, { method: "PATCH", body: { role } });
}

export function setUserStatus(id, status) {
  return apiRequest(`/v1/admin/users/${id}/status`, { method: "PATCH", body: { status } });
}

// ── Enrollments (the caller's own) ──
export function listEnrollments() {
  return apiRequest("/v1/user/enrollments");
}

// One enrollment — unlike the list, it includes completed_lesson_ids.
export function getEnrollment(id) {
  return apiRequest(`/v1/user/enrollments/${id}`);
}

export function enroll(courseId) {
  return apiRequest("/v1/user/enrollments", { method: "POST", body: { course_id: courseId } });
}

export function completeLesson(enrollmentId, lessonId) {
  return apiRequest(`/v1/user/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, { method: "POST" });
}

// ── Classes ──
export function listClasses(guard, { mine } = {}) {
  return apiRequest(`${base(guard)}/classes${guard === "admin" ? "" : toQuery({ mine: mine ? 1 : undefined })}`);
}

export function getClass(guard, id) {
  return apiRequest(`${base(guard)}/classes/${id}`);
}

export function createClass(body) {
  return apiRequest("/v1/user/classes", { method: "POST", body });
}

export function updateClass(id, body) {
  return apiRequest(`/v1/user/classes/${id}`, { method: "PATCH", body });
}

export function joinClass(id) {
  return apiRequest(`/v1/user/classes/${id}/join`, { method: "POST" });
}

export function attachClassCourse(classId, courseId, mandatory) {
  return apiRequest(`/v1/user/classes/${classId}/courses`, {
    method: "POST",
    body: { course_id: courseId, mandatory: !!mandatory },
  });
}

export function detachClassCourse(classId, courseId) {
  return apiRequest(`/v1/user/classes/${classId}/courses/${courseId}`, { method: "DELETE" });
}

export function setClassCourseMandatory(classId, courseId, mandatory) {
  return apiRequest(`/v1/user/classes/${classId}/courses/${courseId}/mandatory`, {
    method: "PATCH",
    body: { mandatory: !!mandatory },
  });
}

export function getClassQuiz(classId) {
  return apiRequest(`/v1/user/classes/${classId}/quiz`);
}

export function saveClassQuiz(classId, body) {
  return apiRequest(`/v1/user/classes/${classId}/quiz`, { method: "PUT", body });
}

export function deleteClassQuiz(classId) {
  return apiRequest(`/v1/user/classes/${classId}/quiz`, { method: "DELETE" });
}

// ── Quiz attempts (topic or class quiz) ──
export function startQuizAttempt({ topicId, classId }) {
  const path = topicId ? `/v1/user/topics/${topicId}/quiz/attempts` : `/v1/user/classes/${classId}/quiz/attempts`;
  return apiRequest(path, { method: "POST" });
}

// answers: [{ question_id, selected_option_ids: [] }]
export function submitQuizAttempt(attemptId, answers) {
  return apiRequest(`/v1/user/quiz-attempts/${attemptId}/submit`, { method: "POST", body: { answers } });
}

// ── Assignments ──
export function listAllAssignments() {
  return apiRequest("/v1/admin/assignments");
}

// Exactly one of classId / courseId.
export function listAssignments({ classId, courseId }) {
  return apiRequest(`/v1/user/assignments${toQuery({ school_class_id: classId, course_id: courseId })}`);
}

export function createAssignment(body) {
  return apiRequest("/v1/user/assignments", { method: "POST", body });
}

export function updateAssignment(id, body) {
  return apiRequest(`/v1/user/assignments/${id}`, { method: "PATCH", body });
}

export function setAssignmentStatus(id, status) {
  return apiRequest(`/v1/user/assignments/${id}/status`, { method: "PATCH", body: { status } });
}

export function deleteAssignment(id) {
  return apiRequest(`/v1/user/assignments/${id}`, { method: "DELETE" });
}

// ── Submissions ──
export function listSubmissions(assignmentId) {
  return apiRequest(`/v1/user/assignments/${assignmentId}/submissions`);
}

export function submitAssignment(assignmentId, file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(`/v1/user/assignments/${assignmentId}/submissions`, { method: "POST", body: form });
}

export function gradeSubmission(id, grade, feedback) {
  return apiRequest(`/v1/user/submissions/${id}`, { method: "PATCH", body: { grade, feedback: feedback || null } });
}

// ── Comments ──
export function listComments(topicId) {
  return apiRequest(`/v1/user/topics/${topicId}/comments`);
}

export function postComment(topicId, text) {
  return apiRequest(`/v1/user/topics/${topicId}/comments`, { method: "POST", body: { text } });
}

export function deleteComment(id) {
  return apiRequest(`/v1/user/comments/${id}`, { method: "DELETE" });
}

// ── Certificates (admin templates) ──
export function listCertificates() {
  return apiRequest("/v1/admin/certificates");
}

export function createCertificate(body) {
  return apiRequest("/v1/admin/certificates", { method: "POST", body });
}

export function updateCertificate(id, body) {
  return apiRequest(`/v1/admin/certificates/${id}`, { method: "PATCH", body });
}

export function deleteCertificate(id) {
  return apiRequest(`/v1/admin/certificates/${id}`, { method: "DELETE" });
}

// ── Dashboards ──
export function getDashboard(guard) {
  return apiRequest(`${base(guard)}/dashboard`);
}

// ── Certificate verification (public) ──
// Resolves to { verification_code, issued_at, pdf_url, learner_name,
// course_title, certificate_title, issuer }; 404 when no certificate matches.
export function verifyCertificate(code) {
  return apiRequest(`/v1/certificates/verify/${encodeURIComponent(code)}`, { auth: false });
}
