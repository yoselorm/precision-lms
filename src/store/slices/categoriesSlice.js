import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as categoriesApi from "../../api/categories";
import { logout } from "./authSlice";
import { listThunk } from "../apiThunk";

const initialState = {
  categories: [],
  // "idle" | "loading" | "succeeded" | "failed" — for the initial list fetch.
  status: "idle",
};

const toCategory = (c) => ({ id: c.id, name: c.name, description: c.description || "" });

// Wraps an API call so a failure rejects with the server's message, which
// pages show in a toast.
const apiThunk = (type, fn) =>
  createAsyncThunk(type, async (arg, thunkApi) => {
    try {
      return await fn(arg, thunkApi);
    } catch (err) {
      return thunkApi.rejectWithValue(err.message);
    }
  });

export const fetchCategories = listThunk("categories/fetch", (_, { getState }) =>
  categoriesApi.listCategories(getState().auth.guard)
);

export const createCategory = apiThunk("categories/create", ({ name, description }) =>
  categoriesApi.createCategory({ name: name.trim(), description: description?.trim() })
);

// Courses store the category's name, so callers pass previousName and the
// courses slice follows the rename (see coursesSlice).
export const updateCategory = apiThunk("categories/update", ({ id, name, description }) =>
  categoriesApi.updateCategory(id, { name: name.trim(), description: description?.trim() })
);

export const deleteCategory = apiThunk("categories/delete", async ({ id }) => {
  await categoriesApi.deleteCategory(id);
  return { id };
});

// Course categories are an admin-managed list, fetched from the API.
const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = (action.payload || []).map(toCategory);
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(toCategory(action.payload));
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updated = toCategory(action.payload);
        const index = state.categories.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.categories[index] = updated;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload.id);
      })
      // The next account may see a different list, so don't carry it over.
      .addCase(logout, () => initialState);
  },
});

export default categoriesSlice.reducer;

export const selectCategories = (state) => state.categories.categories;
export const selectCategoriesStatus = (state) => state.categories.status;
