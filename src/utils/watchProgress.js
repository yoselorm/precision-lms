// Video watch tracking for the lesson guard rails. What counts is the parts
// of the video actually played (as merged [start, end] ranges in seconds),
// not just where the playhead ended up — so jumping to the end doesn't count
// as watching it, and rewatching a part doesn't count twice.
//
// The server has no field for this, so progress is kept per user and lesson
// in the browser. It's a guard rail for honest learners, not tamper-proof.

// Before this share of a video has been watched, learners can't seek ahead
// of what they've already played.
export const SKIP_UNLOCK_SHARE = 0.25;
// A video lesson counts as complete once this share has been watched.
export const COMPLETE_SHARE = 0.9;

// Adds a played range and merges overlapping/adjacent ranges.
export function addRange(ranges, start, end) {
  if (!(end > start)) return ranges;
  const all = [...ranges, [start, end]].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of all) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1] + 0.5) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

export const watchedSeconds = (ranges) => ranges.reduce((sum, [s, e]) => sum + (e - s), 0);

// Furthest point reached by continuous playback from the start — where
// learners may seek up to before the skip rule unlocks.
export function furthestFromStart(ranges) {
  const first = ranges[0];
  return first && first[0] <= 1 ? first[1] : 0;
}

export function watchedShare(ranges, duration) {
  if (!duration || !Number.isFinite(duration)) return 0;
  return Math.min(1, watchedSeconds(ranges) / duration);
}

// Seeking is free once a quarter is watched; before that, only back to (or
// slightly past) what's already been played continuously.
export function canSeekTo(ranges, duration, target) {
  if (watchedShare(ranges, duration) >= SKIP_UNLOCK_SHARE) return true;
  return target <= furthestFromStart(ranges) + 1;
}

const storageKey = (userId, lessonId) => `afenet-lms:watch:${userId}:${lessonId}`;

export function loadProgress(userId, lessonId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId, lessonId)) || "null");
    if (saved && Array.isArray(saved.ranges)) return { ranges: saved.ranges, position: saved.position || 0 };
  } catch {
    // Unavailable or corrupt storage — start fresh.
  }
  return { ranges: [], position: 0 };
}

export function saveProgress(userId, lessonId, progress) {
  try {
    localStorage.setItem(storageKey(userId, lessonId), JSON.stringify(progress));
  } catch {
    // Storage full or blocked — progress just won't survive a reload.
  }
}

// Whether a learner has opened an enrolled course. The server only moves an
// enrollment to "in-progress" once a lesson is completed, so this lets
// course cards say "Resume" as soon as someone has started watching.
const startedKey = (userId, courseId) => `afenet-lms:started:${userId}:${courseId}`;

export function markCourseStarted(userId, courseId) {
  try {
    localStorage.setItem(startedKey(userId, courseId), "1");
  } catch {
    // Storage blocked — the card just keeps saying "Start course".
  }
}

export function hasStartedCourse(userId, courseId) {
  try {
    return localStorage.getItem(startedKey(userId, courseId)) === "1";
  } catch {
    return false;
  }
}
