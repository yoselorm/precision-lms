import { fetchCategories } from "./slices/categoriesSlice";
import { fetchCourses } from "./slices/coursesSlice";
import { fetchUsers } from "./slices/usersSlice";
import { fetchClasses } from "./slices/classesSlice";
import { fetchEnrollments } from "./slices/enrollmentsSlice";
import { fetchAssignments } from "./slices/assignmentsSlice";
import { fetchCertificates } from "./slices/certificatesSlice";
import { fetchDashboard } from "./slices/dashboardSlice";

const roleOf = (getState) => getState().auth.currentUser?.role;

// On sign-in: only what the app shell itself needs — the header's
// notifications (pending approvals, a trainer's classes, a learner's
// completed courses) and the category list forms share. Everything else is
// loaded by the page that shows it (see the page loaders below), so data is
// fresh whenever a page is opened.
export const loadAppData = () => async (dispatch, getState) => {
  const role = roleOf(getState);
  const jobs = [dispatch(fetchCategories()), dispatch(fetchCourses())];
  if (role === "admin") jobs.push(dispatch(fetchUsers()));
  if (role === "trainer") jobs.push(dispatch(fetchClasses()));
  if (role === "learner") jobs.push(dispatch(fetchEnrollments()));
  await Promise.all(jobs);
};

// ── Page loaders ──
// Each refetches what its page shows, every time the page opens. Pages keep
// rendering what's already loaded meanwhile, so navigation stays instant.
// Concurrent requests for the same list are shared (see listThunk).

export const loadCourses = () => (dispatch) => dispatch(fetchCourses());

// Landing page, public catalog and course overview: signed out this hits
// the public catalog endpoint (see fetchCourses).
export const loadPublicCourses = () => (dispatch) => dispatch(fetchCourses());

export const loadClasses = () => async (dispatch) => {
  await Promise.all([dispatch(fetchClasses()), dispatch(fetchCourses())]);
};

export const loadUsers = () => (dispatch) => dispatch(fetchUsers());

export const loadCategories = () => (dispatch) => dispatch(fetchCategories());

// Admin course list also shows which courses have a certificate.
export const loadAdminCourses = () => async (dispatch) => {
  await Promise.all([dispatch(fetchCourses()), dispatch(fetchCertificates()), dispatch(fetchUsers())]);
};

export const loadCertificates = () => async (dispatch) => {
  await Promise.all([dispatch(fetchCertificates()), dispatch(fetchCourses())]);
};

export const loadMyLearning = () => async (dispatch) => {
  await Promise.all([dispatch(fetchEnrollments()), dispatch(fetchCourses())]);
};

// Assignments are listed per class/course for non-admins, so the classes,
// courses and enrollments they hang off are refreshed first.
export const loadAssignments = () => async (dispatch, getState) => {
  const role = roleOf(getState);
  const jobs = [dispatch(fetchClasses()), dispatch(fetchCourses())];
  if (role === "learner") jobs.push(dispatch(fetchEnrollments()));
  await Promise.all(jobs);
  await dispatch(fetchAssignments());
};

// The quizzes themselves are loaded per course/class by the page.
export const loadQuizzes = () => async (dispatch, getState) => {
  const jobs = [dispatch(fetchClasses()), dispatch(fetchCourses())];
  if (roleOf(getState) === "learner") jobs.push(dispatch(fetchEnrollments()));
  await Promise.all(jobs);
};

export const loadDashboard = () => async (dispatch, getState) => {
  const role = roleOf(getState);
  const jobs = [dispatch(fetchDashboard()), dispatch(fetchCourses())];
  if (role === "admin" || role === "trainer") jobs.push(dispatch(fetchClasses()));
  if (role === "learner") jobs.push(dispatch(fetchEnrollments()));
  await Promise.all(jobs);
};

// The course player links to the course's assignments.
export const loadCoursePage = () => async (dispatch, getState) => {
  // Signed out: just the public catalog record.
  if (!getState().auth.token) return dispatch(fetchCourses());
  const jobs = [dispatch(fetchCourses())];
  if (roleOf(getState) === "learner") jobs.push(dispatch(fetchEnrollments()));
  await Promise.all(jobs);
  await dispatch(fetchAssignments());
};

export const loadEnrollPage = () => async (dispatch) => {
  await Promise.all([dispatch(fetchCourses()), dispatch(fetchUsers())]);
};
