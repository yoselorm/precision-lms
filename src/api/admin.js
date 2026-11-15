import { apiRequest, fetchAllPages, toQuery } from "./client";

// Admin-only access control and audit trail.

export function listRoles() {
  return fetchAllPages("/v1/admin/roles");
}

// guard_name "admin" roles carry admin permissions; "user" roles (learner,
// trainer) currently have none.
export function createRole({ name, guardName, permissions }) {
  return apiRequest("/v1/admin/roles", { method: "POST", body: { name, guard_name: guardName, permissions } });
}

export function updateRole(id, { name, guardName, permissions }) {
  return apiRequest(`/v1/admin/roles/${id}`, { method: "PUT", body: { name, guard_name: guardName, permissions } });
}

export function deleteRole(id) {
  return apiRequest(`/v1/admin/roles/${id}`, { method: "DELETE" });
}

export function listPermissions() {
  return fetchAllPages("/v1/admin/permissions");
}

// One page of the audit log, newest first. Returns the full envelope so the
// caller gets `meta` for paging.
export function listAuditLogs({ page = 1, action, search } = {}) {
  return apiRequest(`/v1/admin/audit-logs${toQuery({ page, limit: 25, action, search, sort: "-created_at" })}`, { raw: true });
}
