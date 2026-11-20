import { useEffect, useRef, useState } from "react";
import {
  addRange,
  canSeekTo,
  furthestFromStart,
  watchedShare,
  loadProgress,
  saveProgress,
  COMPLETE_SHARE,
  SKIP_UNLOCK_SHARE,
} from "../utils/watchProgress";

// The lesson-video guard rails, independent of the player: counts only
// continuously played time, blocks seeking ahead until a quarter has been
// watched, remembers progress per browser, and calls `onEligible` once
// enough has been watched to complete the lesson. Players (native <video> or
// an embedded Bunny Stream iframe) feed it time updates and seeks.
//
// With `guard` off (trainer/admin previews) everything is allowed and
// nothing is tracked.
export function useWatchTracker({ guard, userId, lessonId, onProgress, onEligible }) {
  const state = useRef(null);
  if (state.current === null) {
    const saved = guard ? loadProgress(userId, lessonId) : { ranges: [], position: 0 };
    state.current = { ranges: saved.ranges, last: null, eligible: false, lastSaved: 0, lastPct: -1, resumeAt: saved.position, position: saved.position, duration: 0 };
  }
  const [note, setNote] = useState("");
  // Latest callbacks — players may hold on to this tracker across renders.
  const callbacks = useRef({});
  callbacks.current = { onProgress, onEligible };

  const persist = () => {
    if (!guard) return;
    saveProgress(userId, lessonId, { ranges: state.current.ranges, position: state.current.position });
  };

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
      callbacks.current.onEligible?.();
    }
  };

  return {
    note,
    // Where to resume, or null to start from the beginning.
    resumePosition(duration) {
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
        persist();
      }
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
  };
}
