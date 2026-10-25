// Persists the whole Redux store to localStorage so the app survives a
// refresh instead of resetting to the seeded mock data every time — the
// closest a pure-frontend demo can get to "feels like it has a backend".
//
// SCHEMA_VERSION must bump any time the shape of seeded data in mockData.js
// changes (new fields, more quiz questions, etc.) — otherwise everyone who
// already has a persisted session keeps seeing their old cached copy of the
// courses/quizzes forever, silently masking any content/shape update.
const STORAGE_KEY = "afenet-lms:store";
const SCHEMA_VERSION = 10;

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
