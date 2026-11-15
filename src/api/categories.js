import { apiRequest } from "./client";

// Admins and users read the same list through their own guard's route;
// only admins can change it.
export function listCategories(guard) {
  return apiRequest(guard === "admin" ? "/v1/admin/categories" : "/v1/user/categories");
}

export function createCategory({ name, description }) {
  return apiRequest("/v1/admin/categories", { method: "POST", body: { name, description: description || null } });
}

export function updateCategory(id, { name, description }) {
  return apiRequest(`/v1/admin/categories/${id}`, {
    method: "PATCH",
    body: { name, description: description || null },
  });
}

export function deleteCategory(id) {
  return apiRequest(`/v1/admin/categories/${id}`, { method: "DELETE" });
}
