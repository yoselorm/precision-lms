import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import coursesReducer from "./slices/coursesSlice";
import enrollmentsReducer from "./slices/enrollmentsSlice";
import usersReducer from "./slices/usersSlice";
import classesReducer from "./slices/classesSlice";
import assignmentsReducer from "./slices/assignmentsSlice";
import submissionsReducer from "./slices/submissionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    enrollments: enrollmentsReducer,
    users: usersReducer,
    classes: classesReducer,
    assignments: assignmentsReducer,
    submissions: submissionsReducer,
  },
  // Submission file objects/blob URLs aren't plain serializable state in the
  // strictest sense — fine for this demo, so the dev-only check is relaxed
  // rather than silencing real bugs elsewhere.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["submissions/addSubmission"],
      },
    }),
});
