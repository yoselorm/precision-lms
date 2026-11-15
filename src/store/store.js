import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "./slices/authSlice";
import coursesReducer from "./slices/coursesSlice";
import enrollmentsReducer from "./slices/enrollmentsSlice";
import usersReducer from "./slices/usersSlice";
import classesReducer, { initialState as classesInitialState } from "./slices/classesSlice";
import assignmentsReducer from "./slices/assignmentsSlice";
import submissionsReducer from "./slices/submissionsSlice";
import commentsReducer from "./slices/commentsSlice";
import uiReducer from "./slices/uiSlice";
import categoriesReducer from "./slices/categoriesSlice";
import certificatesReducer from "./slices/certificatesSlice";
import dashboardReducer from "./slices/dashboardSlice";
import { loadState, saveState, debounce } from "../utils/persistence";
import { configureApiClient } from "../api/client";

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
    categories: categoriesReducer,
    certificates: certificatesReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  preloadedState: preload(loadState()),
  // Assignment uploads pass a File through the thunk argument.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ["meta.arg.file"],
      },
    }),
});

// Server data is refetched on every load, so only the session and the
// classes a user joined (which the API can't tell us — see classesSlice)
// are kept across refreshes.
function preload(saved) {
  if (!saved) return undefined;
  return {
    auth: saved.auth,
    classes: { ...classesInitialState, joinedIds: saved.joinedClassIds || {} },
  };
}

const persistState = debounce((state) => {
  saveState({ auth: state.auth, joinedClassIds: state.classes.joinedIds });
}, 400);

store.subscribe(() => persistState(store.getState()));

// An expired/revoked token anywhere in the app drops the user back to the
// signed-out view rather than leaving every request failing.
configureApiClient({
  tokenGetter: () => store.getState().auth.token,
  unauthorizedHandler: () => store.dispatch(logout()),
});
