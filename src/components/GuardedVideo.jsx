import React, { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
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

// A lesson video with the learner guard rails: no seeking ahead until a
// quarter has been watched, progress remembered across visits, and
// `onEligible` once enough has been watched to complete the lesson.
// With `guard` off (trainer/admin previews) it's a plain player.
// Render with key={lessonId} so each lesson gets a fresh instance.
export default function GuardedVideo({ src, userId, lessonId, guard, onProgress, onEligible, onEnded }) {
  const videoRef = useRef(null);
  const state = useRef(null);
  if (state.current === null) {
    const saved = guard ? loadProgress(userId, lessonId) : { ranges: [], position: 0 };
    state.current = { ranges: saved.ranges, last: null, correcting: false, eligible: false, lastSaved: 0, lastPct: -1, resumeAt: saved.position };
  }
  const [note, setNote] = useState("");

  const persist = () => {
    const video = videoRef.current;
    if (!guard || !video) return;
    saveProgress(userId, lessonId, { ranges: state.current.ranges, position: video.currentTime });
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

  const report = (video) => {
    const share = watchedShare(state.current.ranges, video.duration);
    const pct = Math.floor(share * 100);
    if (pct !== state.current.lastPct) {
      state.current.lastPct = pct;
      onProgress?.(pct);
    }
    if (!state.current.eligible && share >= COMPLETE_SHARE) {
      state.current.eligible = true;
      onEligible?.();
    }
  };

  const handleLoadedMetadata = (e) => {
    const video = e.currentTarget;
    const { resumeAt } = state.current;
    // Pick up where they left off, unless they'd basically finished.
    if (guard && resumeAt > 1 && resumeAt < video.duration - 2) {
      state.current.correcting = true;
      video.currentTime = resumeAt;
    }
    if (guard) report(video);
  };

  const handleTimeUpdate = (e) => {
    if (!guard) return;
    const video = e.currentTarget;
    const t = video.currentTime;
    const { last } = state.current;
    // Only continuous playback counts — a jump between updates is a seek.
    if (last !== null && !video.seeking && t > last && t - last <= 1.5 * (video.playbackRate || 1)) {
      state.current.ranges = addRange(state.current.ranges, last, t);
    }
    state.current.last = t;
    report(video);
    if (Date.now() - state.current.lastSaved > 5000) {
      state.current.lastSaved = Date.now();
      persist();
    }
  };

  const handleSeeking = (e) => {
    if (!guard) return;
    const video = e.currentTarget;
    if (state.current.correcting) {
      state.current.correcting = false;
      return;
    }
    if (!canSeekTo(state.current.ranges, video.duration, video.currentTime)) {
      state.current.correcting = true;
      video.currentTime = furthestFromStart(state.current.ranges);
      setNote(`You can skip ahead after watching ${Math.round(SKIP_UNLOCK_SHARE * 100)}% of this video.`);
    }
  };

  const handleSeeked = (e) => {
    state.current.last = e.currentTarget.currentTime;
  };

  // Hide the note a few seconds after it appears.
  useEffect(() => {
    if (!note) return undefined;
    const timer = setTimeout(() => setNote(""), 3500);
    return () => clearTimeout(timer);
  }, [note]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onPause={persist}
        onEnded={(e) => {
          persist();
          onEnded?.(watchedShare(state.current.ranges, e.currentTarget.duration));
        }}
        className="aspect-video w-full rounded-xl bg-stone-900"
      >
        <source src={src} />
      </video>
      {note && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
            <Lock size={12} /> {note}
          </span>
        </div>
      )}
    </div>
  );
}
