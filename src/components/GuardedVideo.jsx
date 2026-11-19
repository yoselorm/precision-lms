import React, { useEffect, useRef, useState } from "react";
import { Lock, Maximize, Minimize } from "lucide-react";
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
//
// To discourage copying: no download button or right-click menu, and with
// `watermark` set, that text (the learner's name/email) drifts faintly over
// the video so any recording shows who made it. Fullscreen goes through our
// own button so the watermark stays on screen — the browser's fullscreen
// would show the bare video. None of this stops a determined copier (the
// file itself is public); it raises the bar.
export default function GuardedVideo({ src, userId, lessonId, guard, watermark, onProgress, onEligible, onEnded }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markPos, setMarkPos] = useState({ x: 8, y: 10 });
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

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else wrapperRef.current?.requestFullscreen?.();
  };

  // Move the watermark somewhere new every few seconds so it can't simply be
  // cropped out.
  useEffect(() => {
    if (!watermark) return undefined;
    const timer = setInterval(() => setMarkPos({ x: 5 + Math.random() * 55, y: 8 + Math.random() * 70 }), 7000);
    return () => clearInterval(timer);
  }, [watermark]);

  // Hide the note a few seconds after it appears.
  useEffect(() => {
    if (!note) return undefined;
    const timer = setTimeout(() => setNote(""), 3500);
    return () => clearTimeout(timer);
  }, [note]);

  return (
    <div
      ref={wrapperRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`group relative ${isFullscreen ? "flex items-center bg-black" : ""}`}
    >
      <video
        ref={videoRef}
        controls
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        onDoubleClick={(e) => {
          e.preventDefault();
          toggleFullscreen();
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onPause={persist}
        onEnded={(e) => {
          persist();
          onEnded?.(watchedShare(state.current.ranges, e.currentTarget.duration));
        }}
        className={`w-full bg-stone-900 ${isFullscreen ? "max-h-full" : "aspect-video rounded-xl"}`}
      >
        <source src={src} />
      </video>
      {watermark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute select-none whitespace-nowrap text-xs font-semibold text-white/35 transition-all duration-[2000ms] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] sm:text-sm"
          style={{ left: `${markPos.x}%`, top: `${markPos.y}%` }}
        >
          {watermark}
        </span>
      )}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit full screen" : "Full screen"}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
      >
        {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
      </button>
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
