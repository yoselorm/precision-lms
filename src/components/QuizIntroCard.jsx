import React from "react";
import { HelpCircle, ListChecks, Target, AlertTriangle, PlayCircle, History } from "lucide-react";

// Shown before a quiz is opened, wherever the course/class page links into
// it — quiz meta, a clear warning if it's timed, and a "Start quiz" button
// that hands off to the caller (which navigates to the quiz's own page, so
// the timer never starts until the student has explicitly committed).
export default function QuizIntroCard({ quiz, attempts = [], heading = "Knowledge check", subheading, onStart }) {
  const questionCount = quiz?.questions?.length ?? 0;
  const timeLimitMins = quiz?.timeLimitMins;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;

  return (
    <div className="space-y-3">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{heading}</span>
        {subheading && <h1 className="text-xl font-bold text-stone-900">{subheading}</h1>}
      </div>

      {questionCount === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          This quiz doesn't have any questions yet.
        </div>
      ) : (
        <div className="animate-fade-in rounded-xl border border-stone-200 bg-white p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <HelpCircle size={28} className="text-brand-700" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Ready when you are</h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <ListChecks size={12} /> {questionCount} question{questionCount > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Target size={12} /> Passing score {quiz.passingScore}%
            </span>
          </div>

          {timeLimitMins ? (
            <div className="mx-auto mt-4 flex max-w-sm items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-left text-xs font-medium text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                This quiz is timed — once you start, you'll have <strong>{timeLimitMins} minute{timeLimitMins > 1 ? "s" : ""}</strong> and
                the clock won't pause. It opens on its own page and auto-submits whatever's answered when time runs out, so don't start
                until you're ready to go straight through.
              </span>
            </div>
          ) : (
            <p className="mt-4 text-xs text-stone-400">Untimed — take your time. Opens on its own page.</p>
          )}

          {attempts.length > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <History size={11} /> {attempts.length} previous attempt{attempts.length > 1 ? "s" : ""} · best score {bestScore}%
            </p>
          )}

          <button
            onClick={onStart}
            className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            <PlayCircle size={15} /> Start quiz
          </button>
        </div>
      )}
    </div>
  );
}
