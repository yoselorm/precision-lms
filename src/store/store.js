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
import notificationsReducer from "./slices/notificationsSlice";
import ratingsReducer from "./slices/ratingsSlice";
import quizAttemptsReducer from "./slices/quizAttemptsSlice";
import { loadState, saveState, debounce } from "../utils/persistence";
import { configureApiClient } from "../api/client";
import { fetchMe } from "../api/auth";

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
    notifications: notificationsReducer,
    ratings: ratingsReducer,
    quizAttempts: quizAttemptsReducer,
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

// A 401 can mean the session has expired, or just that this kind of account
// isn't allowed on that endpoint (an admin token on a /v1/user route returns
// 401 too). So before signing anyone out, ask /me whether the token still
// works; only a dead token ends the session. One check covers a burst of
// 401s.
let sessionCheck = null;
configureApiClient({
  tokenGetter: () => store.getState().auth.token,
  unauthorizedHandler: () => {
    if (sessionCheck) return;
    const { token, guard } = store.getState().auth;
    if (!token) return;
    sessionCheck = fetchMe(guard)
      .catch((err) => {
        // Still the same session, and the server rejected it: it's over.
        if (err.status === 401 && store.getState().auth.token === token) store.dispatch(logout());
      })
      .finally(() => (sessionCheck = null));
  },
});
