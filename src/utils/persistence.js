// Persists the signed-in session (and a little per-user state the API can't
// give back) to localStorage so a refresh doesn't sign the user out.
// Everything else is refetched from the API on load.
//
// SCHEMA_VERSION must bump whenever the persisted shape changes, so stale
// saved state is discarded instead of loaded into the wrong shape.
const STORAGE_KEY = "afenet-lms:store";
const SCHEMA_VERSION = 13;

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SCHEMA_VERSION) return undefined;
    return parsed.state;
  } catch {
    return undefined;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, state }));
  } catch {
    // Storage full/unavailable (private browsing, quota) — fail silently,
    // the app still works, it just won't persist this write.
  }
}

export function debounce(fn, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
