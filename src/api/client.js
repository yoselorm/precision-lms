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

// Multipart upload to /uploads (max 20 MB) — resolves to { name, size, url }.
export function uploadFile(guard, file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(guard === "admin" ? "/v1/admin/uploads" : "/v1/user/uploads", { method: "POST", body: form });
}

// Single presigned PUTs to Spaces top out at 5 GB; we cap lower so a long
// upload over a weak connection isn't doomed from the start.
export const MAX_LARGE_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

// Large files (lesson videos) skip the API server: ask it for a presigned
// URL, PUT the file straight to object storage, then use the returned CDN
// `url` like any other link. `onProgress` gets 0–100. Resolves to
// { name, size, url }.
export async function uploadLargeFile(guard, file, { onProgress } = {}) {
  const contentType = file.type || "application/octet-stream";
  const presign = await apiRequest(guard === "admin" ? "/v1/admin/uploads/presign" : "/v1/user/uploads/presign", {
    method: "POST",
    body: { filename: file.name, content_type: contentType },
  });

  // Exactly the signed headers plus Content-Type — anything extra breaks
  // the signature. Browsers set Host themselves (and refuse to let us).
  const headers = { "Content-Type": contentType };
  Object.entries(presign.headers || {}).forEach(([name, values]) => {
    if (name.toLowerCase() !== "host") headers[name] = Array.isArray(values) ? values[0] : values;
  });

  // XHR rather than fetch: fetch can't report upload progress.
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.upload_url);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError(`The upload was rejected by storage (${xhr.status}). Please try again.`, xhr.status, null));
    // Network drops and storage CORS refusals both surface here.
    xhr.onerror = () => reject(new ApiError("The upload was interrupted. Check your connection and try again.", 0, null));
    xhr.send(file);
  });

  return { name: file.name, size: file.size, url: presign.url };
}
