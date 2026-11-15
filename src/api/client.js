// Thin fetch wrapper around the Laravel API. Every response comes back as
// { message, data, status }, so callers get `data` directly and failures are
// thrown as ApiError carrying the server's message for display.
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

let getToken = () => null;
let onUnauthorized = () => {};

// Wired up once from the store so this module never imports it directly
// (the auth slice imports this file — a direct import would be circular).
export function configureApiClient({ tokenGetter, unauthorizedHandler }) {
  getToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Laravel validation errors arrive as { field: [messages] } — surface the
// first one, it's more useful than the generic "The given data was invalid".
function firstValidationMessage(body) {
  const errors = body?.errors || body?.data?.errors || body?.data;
  if (!errors || typeof errors !== "object") return null;
  const first = Object.values(errors).find((v) => Array.isArray(v) && v.length);
  return first ? first[0] : null;
}

// `body` may be a FormData (file uploads) — the browser then sets the
// multipart Content-Type itself. `raw` returns the whole envelope, for
// paginated lists that need `meta`. `token` overrides the session token
// (used while switching identities for admin impersonation).
export async function apiRequest(path, { method = "GET", body, auth = true, raw = false, token: tokenOverride } = {}) {
  const headers = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = auth ? tokenOverride || getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0, null);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const message =
      (res.status === 422 && firstValidationMessage(json)) || json?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.data ?? null);
  }
  return raw ? json : json?.data ?? null;
}

// Builds "?a=1&b=2" from an object, skipping empty values.
export function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
}

// Walks every page of a paginated list endpoint (100 per page, the API max).
// Non-paginated endpoints just return their array on the first call.
export async function fetchAllPages(path, params = {}) {
  const items = [];
  for (let page = 1; ; page++) {
    const json = await apiRequest(`${path}${toQuery({ ...params, limit: 100, page })}`, { raw: true });
    items.push(...(json?.data || []));
    const meta = json?.meta;
    if (!meta || meta.current_page >= meta.last_page) return items;
  }
}

// Multipart upload to /uploads — resolves to { name, size, url }.
export function uploadFile(guard, file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(guard === "admin" ? "/v1/admin/uploads" : "/v1/user/uploads", { method: "POST", body: form });
}
