import { useEffect, useRef, useState } from "react";
import {
  addRange,
  canSeekTo,
  furthestFromStart,
  watchedSeconds,
  watchedShare,
  loadProgress,
  saveProgress,
  COMPLETE_SHARE,
  SKIP_UNLOCK_SHARE,
} from "../utils/watchProgress";

// How often watch progress is sent to the server during playback.
const SYNC_EVERY_MS = 15000;

// The lesson-video guard rails, independent of the player: counts only
// continuously played time, blocks seeking ahead until a quarter has been
// watched, remembers progress, and calls `onEligible` once enough has been
// watched to complete the lesson. Players (native <video> or an embedded
// Bunny Stream iframe) feed it time updates and seeks.
//
// Progress is kept in two places: the exact watched ranges in this browser,
// and a summary on the server (`serverProgress` in, `onSync` out) — the
// server needs it before it will complete a video lesson, and it lets
// learners resume on another device.
//
// With `guard` off (trainer/admin previews) everything is allowed and
// nothing is tracked.
export function useWatchTracker({ guard, userId, lessonId, serverProgress, onProgress, onEligible, onSync }) {
  const state = useRef(null);
  if (state.current === null) {
    const saved = guard ? loadProgress(userId, lessonId) : { ranges: [], position: 0 };
    state.current = {
      ranges: saved.ranges,
      last: null,
      eligible: false,
      lastSaved: 0,
      lastSynced: 0,
      syncedSeconds: -1,
      lastPct: -1,
      resumeAt: saved.position,
      resumed: false,
      position: saved.position,
      duration: 0,
    };
  }
  const [note, setNote] = useState("");
  // Latest callbacks — players may hold on to this tracker across renders.
  const callbacks = useRef({});
  callbacks.current = { onProgress, onEligible, onSync };

  // Whole seconds, as the server takes them. Watched time is rounded up and
  // the duration down so a learner at 90% here is at 90% there too.
  const snapshot = () => {
    const duration = Math.max(1, Math.floor(state.current.duration));
    return {
      watchedSeconds: Math.min(duration, Math.ceil(watchedSeconds(state.current.ranges))),
      position: Math.min(duration, Math.floor(state.current.position)),
      duration,
    };
  };

  const sync = () => {
    if (!guard || !state.current.duration) return;
    const snap = snapshot();
    if (snap.watchedSeconds === state.current.syncedSeconds && Date.now() - state.current.lastSynced < SYNC_EVERY_MS) return;
    state.current.lastSynced = Date.now();
    state.current.syncedSeconds = snap.watchedSeconds;
    callbacks.current.onSync?.(snap);
  };

  const persist = () => {
    if (!guard) return;
    saveProgress(userId, lessonId, { ranges: state.current.ranges, position: state.current.position });
    sync();
  };

  // Progress saved from another device: count what the server has seen
  // (from the start — it only keeps a total) and resume from there if this
  // browser has nothing newer.
  const serverSeconds = serverProgress?.watchedSeconds ?? 0;
  const serverPosition = serverProgress?.position ?? 0;
  useEffect(() => {
    if (!guard || !serverSeconds) return;
    const s = state.current;
    if (serverSeconds > watchedSeconds(s.ranges)) {
      s.ranges = addRange(s.ranges, 0, serverSeconds);
      if (!s.resumed && serverPosition > s.resumeAt) s.resumeAt = serverPosition;
    }
  }, [guard, serverSeconds, serverPosition]);

  // Save on the way out (switching lesson or leaving the page).
  useEffect(() => {
    if (!guard) return undefined;
    window.addEventListener("beforeunload", persist);
    return () => {
      window.removeEventListener("beforeunload", persist);
      persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard, userId, lessonId]);

  // Hide the "can't skip" note a few seconds after it appears.
  useEffect(() => {
    if (!note) return undefined;
    const timer = setTimeout(() => setNote(""), 3500);
    return () => clearTimeout(timer);
  }, [note]);

  const report = () => {
    const share = watchedShare(state.current.ranges, state.current.duration);
    const pct = Math.floor(share * 100);
    if (pct !== state.current.lastPct) {
      state.current.lastPct = pct;
      callbacks.current.onProgress?.(pct);
    }
    if (!state.current.eligible && share >= COMPLETE_SHARE) {
      state.current.eligible = true;
      // The caller sends this to the server before completing the lesson.
      const snap = snapshot();
      state.current.lastSynced = Date.now();
      state.current.syncedSeconds = snap.watchedSeconds;
      callbacks.current.onEligible?.(snap);
    }
  };

  return {
    note,
    // Where to resume, or null to start from the beginning.
    resumePosition(duration) {
      state.current.resumed = true;
      const { resumeAt } = state.current;
      return guard && resumeAt > 1 && resumeAt < duration - 2 ? resumeAt : null;
    },
    // Playback reached `t`. `maxStep` is the largest gap between updates that
    // still counts as continuous playback (bigger jumps are seeks).
    timeUpdate(t, duration, maxStep) {
      state.current.duration = duration || state.current.duration;
      state.current.position = t;
      if (!guard) return;
      const { last } = state.current;
      if (last !== null && t > last && t - last <= maxStep) {
        state.current.ranges = addRange(state.current.ranges, last, t);
      }
      state.current.last = t;
      report();
      if (Date.now() - state.current.lastSaved > 5000) {
        state.current.lastSaved = Date.now();
        saveProgress(userId, lessonId, { ranges: state.current.ranges, position: state.current.position });
      }
      if (Date.now() - state.current.lastSynced > SYNC_EVERY_MS) sync();
    },
    // The viewer moved to `target`. Returns where playback should be put back
    // to if that's not allowed yet, otherwise null.
    seek(target, duration) {
      state.current.duration = duration || state.current.duration;
      if (!guard || canSeekTo(state.current.ranges, state.current.duration, target)) {
        state.current.last = target;
        return null;
      }
      const back = furthestFromStart(state.current.ranges);
      state.current.last = back;
      setNote(`You can skip ahead after watching ${Math.round(SKIP_UNLOCK_SHARE * 100)}% of this video.`);
      return back;
    },
    // Resets the continuity marker without counting the jump (e.g. resume).
    jumpedTo(t) {
      state.current.last = t;
      state.current.position = t;
    },
    persist,
    share() {
      return watchedShare(state.current.ranges, state.current.duration);
    },
    snapshot,
  };
}
