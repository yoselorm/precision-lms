import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

// Read-only rendering of a quiz's questions with the correct answers marked —
// for admins and course authors reviewing a quiz without taking it.
export default function QuizPreview({ quiz }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · pass mark {quiz.passingScore}%
        {quiz.timeLimitMins ? ` · ${quiz.timeLimitMins} min limit` : ""}
        {` · ${quiz.maxAttempts ? `${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? "" : "s"}` : "unlimited attempts"}`}
        {quiz.showAnswers === false ? " · answers never shown to learners" : " · answers shown after last attempt"}
      </p>
      {quiz.questions.map((q, i) => (
        <div key={q.id ?? i} className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-800">
            {i + 1}. {q.prompt}
          </p>
          {q.type === "multi" && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Select all that apply</p>}
          <ul className="mt-2.5 space-y-1.5">
            {q.options.map((opt, j) => {
              const correct = (q.correct || []).includes(j);
              return (
                <li
                  key={j}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    correct ? "bg-emerald-50 font-semibold text-emerald-800" : "text-stone-600"
                  }`}
                >
                  {correct ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> : <Circle size={14} className="shrink-0 text-stone-300" />}
                  {opt}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
