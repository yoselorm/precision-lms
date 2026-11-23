import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/ratings";
import { getPublicCourse } from "../../api/courses";
import { ApiError } from "../../api/client";
import { normalizeRating } from "../../api/normalize";
import { apiThunk } from "../apiThunk";
import { upsertCourses } from "./coursesSlice";
import { logout, startPreview, stopPreview } from "./authSlice";

const PAGE_SIZE = 10;

const emptyList = { items: [], page: 0, lastPage: 1, status: "idle" };

const initialState = {
  // Public reviews per course: { [courseId]: { items, page, lastPage, status } }.
  byCourse: {},
  // The signed-in learner's own rating per course: a rating, or null for
  // none. Missing = not loaded yet.
  mine: {},
  // Admin moderation list (optionally filtered to one course).
  admin: { ...emptyList, courseId: "" },
};

// The course record carries average_rating / ratings_count — refresh it
// after the learner's rating changes so cards and summaries follow.
async function refreshCourse(courseId, dispatch) {
  try {
    dispatch(upsertCourses([await getPublicCourse(courseId)]));
  } catch {
    // Not critical — the numbers catch up on the next course list load.
  }
}

export const fetchCourseRatings = apiThunk("ratings/fetchCourse", async ({ courseId, more = false }, { getState }) => {
  const current = getState().ratings.byCourse[courseId];
  const page = more && current ? current.page + 1 : 1;
  const json = await api.listCourseRatings(courseId, { limit: PAGE_SIZE, page });
  return { courseId, items: json?.data || [], page, lastPage: json?.meta?.last_page ?? page, more };
});

export const fetchMyRating = apiThunk("ratings/fetchMine", async ({ courseId }) => {
  try {
    return { courseId, rating: await api.getMyRating(courseId) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { courseId, rating: null };
    throw err;
  }
});

export const saveMyRating = apiThunk("ratings/saveMine", async ({ courseId, rating, review }, { dispatch }) => {
  const saved = await api.saveMyRating(courseId, { rating, review });
  await Promise.all([refreshCourse(courseId, dispatch), dispatch(fetchCourseRatings({ courseId }))]);
  return { courseId, rating: saved };
});

export const deleteMyRating = apiThunk("ratings/deleteMine", async ({ courseId }, { dispatch }) => {
  await api.deleteMyRating(courseId);
  await Promise.all([refreshCourse(courseId, dispatch), dispatch(fetchCourseRatings({ courseId }))]);
  return { courseId };
});

export const fetchAdminRatings = apiThunk("ratings/fetchAdmin", async ({ courseId = "", more = false } = {}, { getState }) => {
  const current = getState().ratings.admin;
  const page = more ? current.page + 1 : 1;
  const json = await api.listAllRatings({ courseId: courseId || undefined, limit: 50, page });
  return { courseId, items: json?.data || [], page, lastPage: json?.meta?.last_page ?? page, more };
});

export const deleteRating = apiThunk("ratings/delete", async ({ id, courseId }, { dispatch }) => {
  await api.deleteRating(id);
  if (courseId) await refreshCourse(courseId, dispatch);
  return { id, courseId };
});

// Adds a page of ratings to a list, replacing it for page 1.
function applyPage(list, { items, page, lastPage, more }) {
  const incoming = items.map(normalizeRating);
  if (more) {
    const known = new Set(list.items.map((r) => r.id));
    list.items.push(...incoming.filter((r) => !known.has(r.id)));
  } else list.items = incoming;
  list.page = page;
  list.lastPage = lastPage;
  list.status = "succeeded";
}

const ratingsSlice = createSlice({
  name: "ratings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseRatings.pending, (state, action) => {
        const { courseId } = action.meta.arg;
        state.byCourse[courseId] = { ...(state.byCourse[courseId] || emptyList), status: "loading" };
      })
      .addCase(fetchCourseRatings.fulfilled, (state, action) => {
        applyPage(state.byCourse[action.payload.courseId], action.payload);
      })
      .addCase(fetchCourseRatings.rejected, (state, action) => {
        state.byCourse[action.meta.arg.courseId].status = "failed";
      })
      .addCase(fetchMyRating.fulfilled, (state, action) => {
        const { courseId, rating } = action.payload;
        state.mine[courseId] = rating ? normalizeRating(rating) : null;
      })
      .addCase(saveMyRating.fulfilled, (state, action) => {
        state.mine[action.payload.courseId] = normalizeRating(action.payload.rating);
      })
      .addCase(deleteMyRating.fulfilled, (state, action) => {
        state.mine[action.payload.courseId] = null;
      })
      .addCase(fetchAdminRatings.pending, (state, action) => {
        state.admin.status = "loading";
        state.admin.courseId = action.meta.arg?.courseId || "";
      })
      .addCase(fetchAdminRatings.fulfilled, (state, action) => {
        // Ignore a slower response for a filter that's since changed.
        if (action.payload.courseId !== state.admin.courseId) return;
        applyPage(state.admin, action.payload);
      })
      .addCase(fetchAdminRatings.rejected, (state) => {
        state.admin.status = "failed";
      })
      .addCase(deleteRating.fulfilled, (state, action) => {
        const { id } = action.payload;
        state.admin.items = state.admin.items.filter((r) => r.id !== id);
        Object.values(state.byCourse).forEach((list) => {
          list.items = list.items.filter((r) => r.id !== id);
        });
      })
      .addCase(startPreview.fulfilled, (state) => {
        state.mine = {};
      })
      .addCase(stopPreview.fulfilled, (state) => {
        state.mine = {};
      })
      .addCase(logout, () => initialState);
  },
});

export default ratingsSlice.reducer;

export const selectCourseRatings = (state, courseId) => state.ratings.byCourse[courseId] || emptyList;
export const selectMyRating = (state, courseId) => state.ratings.mine[courseId];
export const selectAdminRatings = (state) => state.ratings.admin;
