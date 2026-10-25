import { createSlice, nanoid } from "@reduxjs/toolkit";
import { mockCategories } from "../../data/mockData";

const initialState = {
  categories: mockCategories,
};

// Course categories are an admin-managed list. Courses store the category's
// name, so renaming one also renames it on every course (see coursesSlice).
const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    addCategory: {
      reducer(state, action) {
        state.categories.push(action.payload);
      },
      prepare({ name, description }) {
        return { payload: { id: `cat-${nanoid(6)}`, name: name.trim(), description: description?.trim() || "" } };
      },
    },
    // Edits a category's name and description (courses follow a rename).
    renameCategory(state, action) {
      const { id, name, description } = action.payload;
      const category = state.categories.find((c) => c.id === id);
      if (!category) return;
      category.name = name.trim();
      if (description !== undefined) category.description = description.trim();
    },
    removeCategory(state, action) {
      state.categories = state.categories.filter((c) => c.id !== action.payload.id);
    },
  },
});

export const { addCategory, renameCategory, removeCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;

export const selectCategories = (state) => state.categories.categories;
