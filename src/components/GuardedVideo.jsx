import React, { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { useWatchTracker } from "../hooks/useWatchTracker";
import { bunnyEmbedUrl } from "../utils/videoEmbed";

function SkipNote({ note }) {
  if (!note) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
        <Lock size={12} /> {note}
      </span>
    </div>
  );
}

// Uploaded videos and direct video links play in a native <video>.
function NativeVideo({ src, tracker, autoPlay, onEnded }) {
  const correcting = useRef(false);

  return (
    <div onContextMenu={(e) => e.preventDefault()} className="relative">
      <video
        controls
        autoPlay={autoPlay}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          const resume = tracker.resumePosition(video.duration);
          if (resume !== null) {
            correcting.current = true;
            video.currentTime = resume;
            tracker.jumpedTo(resume);
          }
          tracker.timeUpdate(video.currentTime, video.duration, 0);
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          if (!video.seeking) tracker.timeUpdate(video.currentTime, video.duration, 1.5 * (video.playbackRate || 1));
        }}
        onSeeking={(e) => {
          const video = e.currentTarget;
          if (correcting.current) {
            correcting.current = false;
            return;
          }
          const back = tracker.seek(video.currentTime, video.duration);
          if (back !== null) {
            correcting.current = true;
            video.currentTime = back;
          }
        }}
        onPause={tracker.persist}
        onEnded={() => {
          tracker.persist();
          onEnded?.(tracker.share(), tracker.snapshot());
        }}
        className="aspect-video w-full rounded-xl bg-stone-900"
      >
        <source src={src} />
      </video>
      <SkipNote note={tracker.note} />
    </div>
  );
}

// Bunny Stream videos play in Bunny's own player (an iframe). It speaks the
// Player.js protocol, so the same guard rails work through its events
// (timeupdate / seeked / ended) and setCurrentTime.
function BunnyVideo({ src, tracker, autoPlay, onEnded }) {
  const frameRef = useRef(null);
  const embed = bunnyEmbedUrl(src, { autoPlay });
  const status = useRef({ duration: 0, last: 0, correcting: false, ready: false });
  // The message handler is set up once; always reach the latest props.
  const latest = useRef({});
  latest.current = { tracker, onEnded };

  useEffect(() => {
    const frame = frameRef.current;
    const send = (message) =>
      frame?.contentWindow?.postMessage(JSON.stringify({ context: "player.js", version: "0.0.11", ...message }), "*");
    const listen = ["timeupdate", "seeked", "ended", "pause"];

    const onMessage = (e) => {
      if (e.source !== frame?.contentWindow) return;
      let data = e.data;
      try {
        data = typeof data === "string" ? JSON.parse(data) : data;
      } catch {
        return;
      }
      if (data?.context !== "player.js") return;
      const s = status.current;
      const { tracker, onEnded } = latest.current;

      if (data.event === "ready" && !s.ready) {
        s.ready = true;
        listen.forEach((event, i) => send({ method: "addEventListener", value: event, listener: `afenet-${i}` }));
        // Duration comes with the first timeupdate; resume once known.
        s.pendingResume = true;
      } else if (data.event === "timeupdate") {
        const { seconds = 0, duration = 0 } = data.value || {};
        s.duration = duration;
        if (s.pendingResume && duration) {
          s.pendingResume = false;
          const resume = tracker.resumePosition(duration);
          if (resume !== null) {
            s.correcting = true;
            tracker.jumpedTo(resume);
            send({ method: "setCurrentTime", value: resume });
            s.last = resume;
            return;
          }
        }
        // Bunny reports ~4x a second; a bigger forward jump is a seek.
        const step = seconds - s.last;
        if (!s.correcting && step > 3) {
          const back = tracker.seek(seconds, duration);
          if (back !== null) {
            s.correcting = true;
            send({ method: "setCurrentTime", value: back });
            s.last = back;
            return;
          }
        }
        if (s.correcting && Math.abs(step) < 3) s.correcting = false;
        tracker.timeUpdate(seconds, duration, 3);
        s.last = seconds;
      } else if (data.event === "seeked") {
        // Seeks while paused don't produce a jump in timeupdate.
        const { seconds } = data.value || {};
        if (typeof seconds === "number" && !s.correcting) {
          const back = tracker.seek(seconds, s.duration);
          if (back !== null) {
            s.correcting = true;
            send({ method: "setCurrentTime", value: back });
          }
          s.last = back ?? seconds;
        }
      } else if (data.event === "pause") {
        tracker.persist();
      } else if (data.event === "ended") {
        tracker.persist();
        onEnded?.(tracker.share(), tracker.snapshot());
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed]);

  return (
    <div onContextMenu={(e) => e.preventDefault()} className="relative aspect-video w-full overflow-hidden rounded-xl bg-stone-900">
      <iframe
        ref={frameRef}
        src={embed}
        title="Lesson video"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
      <SkipNote note={tracker.note} />
    </div>
  );
}

// A lesson video with the learner guard rails (see useWatchTracker): no
// seeking ahead until a quarter has been watched, progress remembered across
// visits (and devices, through `serverProgress` / `onSync`), and
// `onEligible(snapshot)` once enough has been watched to complete it.
// With `guard` off (trainer/admin previews) it's a plain player.
// Render with key={lessonId} so each lesson gets a fresh instance.
//
// To discourage copying there's no download button or right-click menu.
// That doesn't stop a determined copier; it raises the bar.
export default function GuardedVideo({ src, userId, lessonId, guard, autoPlay, serverProgress, onProgress, onEligible, onSync, onEnded }) {
  const tracker = useWatchTracker({ guard, userId, lessonId, serverProgress, onProgress, onEligible, onSync });
  return bunnyEmbedUrl(src) ? (
    <BunnyVideo src={src} tracker={tracker} autoPlay={autoPlay} onEnded={onEnded} />
  ) : (
    <NativeVideo src={src} tracker={tracker} autoPlay={autoPlay} onEnded={onEnded} />
  );
}
