import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import coursesReducer from "./slices/coursesSlice";
import enrollmentsReducer from "./slices/enrollmentsSlice";
import usersReducer from "./slices/usersSlice";
import classesReducer from "./slices/classesSlice";
import assignmentsReducer from "./slices/assignmentsSlice";
import submissionsReducer from "./slices/submissionsSlice";
import commentsReducer from "./slices/commentsSlice";
import uiReducer from "./slices/uiSlice";
import { loadState, saveState, debounce } from "../utils/persistence";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    enrollments: enrollmentsReducer,
    users: usersReducer,
    classes: classesReducer,
    assignments: assignmentsReducer,
    submissions: submissionsReducer,
    comments: commentsReducer,
    ui: uiReducer,
  },
  preloadedState: loadState(),
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

// Persist everything except the toast queue — toasts are transient UI state,
// re-showing them after a refresh would be confusing rather than helpful.
const persistState = debounce((state) => {
  const { ui, ...rest } = state;
  saveState(rest);
}, 400);

store.subscribe(() => persistState(store.getState()));
