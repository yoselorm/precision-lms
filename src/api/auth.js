import { apiRequest } from "./client";

// Admins and learners/trainers are separate guards with separate login
// endpoints, matching the app's two sign-in pages: `portal` "admin" uses
// /admin/login (→ data.admin), anything else /login (→ data.user). The
// guard decides which /me and /logout endpoints the token works with.
export async function login(email, password, portal) {
  const guard = portal === "admin" ? "admin" : "user";
  const data = await apiRequest(guard === "admin" ? "/admin/login" : "/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  return { user: guard === "admin" ? data.admin : data.user, token: data.token, guard };
}

// Pending trainers come back without a token — they can't sign in until an
// admin approves them — and their response is the bare user rather than
// { user, token }.
export async function register({ name, email, password, role, department }) {
  const data = await apiRequest("/register", {
    method: "POST",
    body: { name, email, password, role, department: department || null },
    auth: false,
  });
  return { user: data.user ?? data, token: data.token || null, guard: "user" };
}

export function fetchMe(guard) {
  return apiRequest(guard === "admin" ? "/admin/me" : "/me");
}

export function logout(guard, token) {
  return apiRequest(guard === "admin" ? "/admin/logout" : "/logout", { method: "POST", token });
}

// Admin "preview as": issues a short-lived user token for `userId`, then
// loads that user's full record with it. Both calls are made explicitly with
// the given tokens since the session token is about to change.
export async function impersonate(userId, adminToken) {
  const data = await apiRequest(`/v1/admin/users/${userId}/impersonate`, { method: "POST", token: adminToken });
  const user = await apiRequest("/me", { token: data.token });
  return { user, token: data.token, tokenId: data.token_id };
}

export function stopImpersonation(tokenId, adminToken) {
  return apiRequest("/v1/admin/impersonation/stop", { method: "POST", body: { token_id: tokenId }, token: adminToken });
}
