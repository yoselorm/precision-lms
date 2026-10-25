import React from "react";
import { Award, RotateCcw, Check, X as XIcon } from "lucide-react";
import { sameSet } from "../utils/quiz";

// Pass/fail summary shown right after a submit. `onBack` is optional — omit
// it where there's no obvious "back to X" destination (e.g. a class quiz
// taken inline on the class page already).
// `onRetry` is omitted once the learner has no attempts left.
export function QuizResult({ score, passingScore, onBack, backLabel = "Back", onRetry, attemptsLeft, hasCertificate, onViewCertificate }) {
  const passed = score >= passingScore;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 text-center sm:p-8">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          passed ? "bg-emerald-50" : "bg-rose-50"
        }`}
      >
        <Award size={32} className={passed ? "text-emerald-600" : "text-rose-500"} />
      </div>
      <h2 className="text-lg font-bold text-stone-900">{passed ? "You passed!" : "Not quite there"}</h2>
      <p className="mb-4 text-sm text-stone-500">
        You scored <strong>{score}%</strong> — passing score is {passingScore}%.
      </p>
      {!passed && attemptsLeft !== undefined && (
        <p className="-mt-2 mb-4 text-xs font-semibold text-stone-500">
          {attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left` : "You've used all your attempts for this quiz."}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onBack && (
          <button onClick={onBack} className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            {backLabel}
          </button>
        )}
        {!passed && onRetry && (
          <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            <RotateCcw size={14} /> Retry quiz
          </button>
        )}
        {passed && hasCertificate && (
          <button onClick={onViewCertificate} className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            View certificate
          </button>
        )}
      </div>
    </div>
  );
}

// Per-question breakdown shown after a submit: what was picked and whether
// it was right. The correct answers themselves are only shown when
// `revealCorrect` is set — the quiz's author decides when learners see them.
export function QuizReview({ questions, answers, revealCorrect = true }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Review your answers</h3>
      {!revealCorrect && (
        <p className="text-xs text-stone-400">Correct answers aren't shown yet — you'll see which questions you got right or wrong.</p>
      )}
      {questions.map((q, qi) => {
        const selected = answers[q.id] || [];
        const correct = sameSet(selected, q.correct);
        return (
          <div key={q.id} className={`rounded-xl border p-4 ${correct ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}>
            <p className="mb-2 flex items-start gap-2 text-sm font-semibold text-stone-800">
              {correct ? <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <XIcon size={15} className="mt-0.5 shrink-0 text-rose-600" />}
              <span>
                {qi + 1}. {q.prompt}
              </span>
            </p>
            <div className="ml-[23px] space-y-1">
              {q.options.map((opt, oi) => {
                const isCorrectOption = q.correct.includes(oi);
                const wasPicked = selected.includes(oi);
                if (!revealCorrect) {
                  return (
                    <p key={oi} className={`text-xs ${wasPicked ? "font-semibold text-stone-800" : "text-stone-500"}`}>
                      {wasPicked ? "●" : "·"} {opt}
                    </p>
                  );
                }
                return (
                  <p
                    key={oi}
                    className={`text-xs ${
                      isCorrectOption ? "font-semibold text-emerald-700" : wasPicked ? "font-semibold text-rose-600 line-through" : "text-stone-500"
                    }`}
                  >
                    {isCorrectOption ? "✓" : wasPicked ? "✗" : "·"} {opt}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
