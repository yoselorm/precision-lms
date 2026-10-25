import React, { useEffect, useRef, useState } from "react";
import { CheckSquare, Square, History, Timer } from "lucide-react";
import { sameSet, formatClock } from "../utils/quiz";
import { QuizResult, QuizReview } from "./QuizPieces";
import QuizPreview from "./QuizPreview";

// The actual "taking the quiz" experience — questions, live countdown if the
// quiz has a time limit, grading on submit, a per-question review, and
// retrying. Lives on its own dedicated page (CourseQuizPage / ClassQuizPage)
// reached only after the student has already seen QuizIntroCard's warning
// and clicked "Start quiz" — so the timer can safely start the moment this
// component mounts, and restart on every retry.
export default function QuizTaker({
  quiz,
  attempts = [],
  heading = "Knowledge check",
  subheading,
  onSubmit,
  onBack,
  backLabel,
  hasCertificate,
  onViewCertificate,
}) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);

  // The countdown interval closes over quizAnswers at effect-setup time, so
  // a ref keeps grading reading the *latest* picks rather than a stale one.
  const quizAnswersRef = useRef(quizAnswers);
  quizAnswersRef.current = quizAnswers;

  const toggleAnswer = (question, optionIndex) => {
    setQuizAnswers((prev) => {
      if (question.type === "multi") {
        const current = prev[question.id] || [];
        const next = current.includes(optionIndex) ? current.filter((i) => i !== optionIndex) : [...current, optionIndex];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optionIndex] };
    });
  };

  const isQuestionAnswered = (q) => (quizAnswers[q.id] || []).length > 0;

  // Attempt limits: `attempts` comes from the store, so it already includes
  // the attempt just submitted by the time the result screen renders.
  const maxAttempts = quiz?.maxAttempts || null;
  const attemptsLeft = maxAttempts ? Math.max(0, maxAttempts - attempts.length) : undefined;
  const outOfAttempts = attemptsLeft === 0;
  const hasPassed = attempts.some((a) => a.passed);
  const revealAnswers = quiz?.showAnswers !== false;
  // Opened again after the last attempt was already used — nothing to take.
  const locked = outOfAttempts && !quizSubmitted;

  const handleSubmit = (timedOut = false) => {
    const answers = quizAnswersRef.current;
    const total = quiz.questions.length;
    const correctCount = quiz.questions.filter((q) => sameSet(answers[q.id] || [], q.correct)).length;
    const score = total ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= quiz.passingScore;

    setLastResult({ score, answersSnapshot: answers });
    setQuizSubmitted(true);
    onSubmit?.(score, passed, timedOut);
  };

  const handleRetry = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Starts on mount, restarts on retry (quizSubmitted flips back to false),
  // and its cleanup fires on unmount — i.e. when the student navigates away
  // from this quiz's own page.
  const timeLimitMins = quiz?.timeLimitMins;
  useEffect(() => {
    if (quizSubmitted || !timeLimitMins || locked) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(timeLimitMins * 60);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, [quizSubmitted, timeLimitMins, locked]);

  useEffect(() => {
    if (secondsLeft === 0 && !quizSubmitted) {
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{heading}</span>
          {subheading && <h1 className="text-xl font-bold text-stone-900">{subheading}</h1>}
          <p className="text-xs text-stone-400">Passing score: {quiz.passingScore}% · auto-graded on submit</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {secondsLeft !== null && !quizSubmitted && (
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold tabular-nums transition-colors ${
                secondsLeft <= 30 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <Timer size={12} /> {formatClock(secondsLeft)}
            </span>
          )}
          {attempts.length > 0 && (
            <button
              onClick={() => setShowAttemptHistory((v) => !v)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-500 transition hover:bg-stone-50"
            >
              <History size={12} /> {attempts.length} attempt{attempts.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {timeLimitMins && !quizSubmitted && (
        <p className="-mt-3 text-[11px] text-stone-400">This quiz is timed — it auto-submits when the clock runs out.</p>
      )}

      {showAttemptHistory && attempts.length > 0 && (
        <div className="animate-fade-in space-y-1.5 rounded-xl border border-stone-200 bg-white p-3">
          {[...attempts].reverse().map((a, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Attempt {attempts.length - i} ·{" "}
                {new Date(a.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
              <span className={`font-semibold ${a.passed ? "text-emerald-700" : "text-rose-600"}`}>{a.score}%</span>
            </div>
          ))}
        </div>
      )}

      {locked ? (
        <div className="animate-fade-in space-y-5">
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-center sm:p-8">
            <h2 className="text-lg font-bold text-stone-900">No attempts left</h2>
            <p className="mt-1 text-sm text-stone-500">
              {maxAttempts === 1 ? "You've used your only attempt" : `You've used all ${maxAttempts} attempts`} · best score{" "}
              {Math.max(...attempts.map((a) => a.score))}%{hasPassed ? " (passed)" : ""}
            </p>
            {onBack && (
              <button onClick={onBack} className="mt-4 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                {backLabel}
              </button>
            )}
          </div>
          {revealAnswers && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">Correct answers</h3>
              <QuizPreview quiz={quiz} />
            </div>
          )}
        </div>
      ) : quiz.questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          This quiz doesn't have any questions yet.
        </div>
      ) : !quizSubmitted ? (
        <div className="animate-fade-in space-y-5">
          {quiz.questions.map((q, qi) => {
            const selected = quizAnswers[q.id] || [];
            return (
              <div key={q.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-stone-800">
                  {qi + 1}. {q.prompt}
                  {q.type === "multi" && <span className="ml-1.5 text-[10px] font-normal text-stone-400">(select all that apply)</span>}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const checked = selected.includes(oi);
                    const OptionIcon = q.type === "multi" ? (checked ? CheckSquare : Square) : undefined;
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition ${
                          checked ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {q.type === "multi" ? (
                          <>
                            <input type="checkbox" checked={checked} onChange={() => toggleAnswer(q, oi)} className="sr-only" />
                            <OptionIcon size={15} className={checked ? "text-brand-700" : "text-stone-400"} />
                          </>
                        ) : (
                          <input type="radio" name={q.id} checked={checked} onChange={() => toggleAnswer(q, oi)} className="text-brand-700" />
                        )}
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => handleSubmit()}
            disabled={!quiz.questions.every(isQuestionAnswered)}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit answers
          </button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          <QuizResult
            score={lastResult?.score ?? 0}
            passingScore={quiz.passingScore}
            onBack={onBack}
            backLabel={backLabel}
            onRetry={outOfAttempts ? undefined : handleRetry}
            attemptsLeft={attemptsLeft}
            hasCertificate={hasCertificate}
            onViewCertificate={onViewCertificate}
          />
          <QuizReview
            questions={quiz.questions}
            answers={lastResult?.answersSnapshot ?? {}}
            revealCorrect={revealAnswers && (hasPassed || outOfAttempts)}
          />
        </div>
      )}
    </div>
  );
}
