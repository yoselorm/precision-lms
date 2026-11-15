import { apiRequest, ApiError } from "./client";

// One login endpoint for everyone: the backend checks admins first, then
// users, and says which it matched via `type`. That type is the guard the
// token belongs to, so /me and /logout must use the matching endpoints.
//
// The app has separate sign-in pages for admins and for learners/trainers,
// so `portal` ("admin" | "user") says which kind of account this page
// accepts. A match of the other kind has its fresh token revoked and is
// rejected with a pointer to the right page.
export async function login(email, password, portal) {
  const data = await apiRequest("/login", { method: "POST", body: { email, password }, auth: false });
  const guard = data.type === "admin" ? "admin" : "user";
  if (portal && guard !== portal) {
    await logout(guard, data.token).catch(() => {});
    throw new ApiError(
      portal === "admin"
        ? "This isn't an admin account. Learners and trainers sign in on the main login page."
        : "This is an admin account. Please sign in on the admin login page.",
      403,
      null
    );
  }
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
