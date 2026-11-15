import { fetchCategories } from "./slices/categoriesSlice";
import { fetchCourses } from "./slices/coursesSlice";
import { fetchUsers } from "./slices/usersSlice";
import { fetchClasses } from "./slices/classesSlice";
import { fetchEnrollments } from "./slices/enrollmentsSlice";
import { fetchAssignments } from "./slices/assignmentsSlice";
import { fetchCertificates } from "./slices/certificatesSlice";
import { fetchDashboard } from "./slices/dashboardSlice";

// Loads the data the signed-in user's pages draw on. Assignments go last:
// for learners/trainers they're listed per class and per course, so those
// need to be known first. Individual failures don't stop the rest — each
// slice tracks its own status.
export const loadAppData = () => async (dispatch, getState) => {
  const role = getState().auth.currentUser?.role;
  const first = [dispatch(fetchCategories()), dispatch(fetchCourses()), dispatch(fetchClasses()), dispatch(fetchDashboard())];
  if (role === "admin") first.push(dispatch(fetchUsers()), dispatch(fetchCertificates()));
  if (role === "learner") first.push(dispatch(fetchEnrollments()));
  await Promise.all(first);
  await dispatch(fetchAssignments());
};
