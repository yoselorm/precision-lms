import React, { useState } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { Plus, Trash2, CheckSquare, Circle, CheckCircle2, ListChecks, ToggleLeft, X, Timer, AlertCircle } from "lucide-react";

const TYPE_META = {
  single: { label: "Multiple choice", Icon: Circle },
  multi: { label: "Select all that apply", Icon: CheckSquare },
};

function emptyDraft() {
  return { type: "single", prompt: "", options: ["", ""], correct: [] };
}

// Authors a quiz: a passing score plus a working list of questions, each
// with its own options and correct-answer marking. Mirrors the
// draft-list-then-add pattern used by TopicListEditor for a consistent feel.
export default function QuizBuilder({
  passingScore,
  onPassingScoreChange,
  timeLimitMins,
  onTimeLimitChange,
  questions,
  onQuestionsChange,
}) {
  const [draft, setDraft] = useState(emptyDraft());

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const setType = (type) => {
    // Switching to multi keeps any single correct pick as a starting point;
    // switching to single collapses down to (at most) the first pick.
    setDraft((prev) => ({
      ...prev,
      type,
      correct: type === "single" ? prev.correct.slice(0, 1) : prev.correct,
    }));
  };

  const fillTrueFalse = () => {
    setDraft({ type: "single", prompt: draft.prompt, options: ["True", "False"], correct: [] });
  };

  const updateOption = (i, value) => {
    setDraft((prev) => ({ ...prev, options: prev.options.map((o, idx) => (idx === i ? value : o)) }));
  };

  const addOption = () => setDraft((prev) => ({ ...prev, options: [...prev.options, ""] }));

  const removeOption = (i) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== i),
      correct: prev.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
    }));
  };

  const toggleCorrect = (i) => {
    setDraft((prev) => {
      if (prev.type === "single") return { ...prev, correct: [i] };
      const has = prev.correct.includes(i);
      return { ...prev, correct: has ? prev.correct.filter((c) => c !== i) : [...prev.correct, i].sort() };
    });
  };

  const filledOptionCount = draft.options.filter((o) => o.trim()).length;
  const canAdd = draft.prompt.trim() && filledOptionCount >= 2 && draft.correct.length > 0;
  // Tells the author exactly what's missing instead of a silently-disabled
  // button — the single biggest source of "I can't add my question" confusion.
  const missingReason = !draft.prompt.trim()
    ? "Add a question prompt"
    : filledOptionCount < 2
    ? "Fill in at least 2 options"
    : draft.correct.length === 0
    ? draft.type === "single"
      ? "Mark which option is correct (click the circle next to it)"
      : "Mark at least one option as correct (click the checkbox next to it)"
    : null;

  const addQuestion = () => {
    if (!canAdd) return;
    const cleanOptions = draft.options.map((o) => o.trim()).filter(Boolean);
    onQuestionsChange([
      ...questions,
      { id: `q-${nanoid(6)}`, type: draft.type, prompt: draft.prompt.trim(), options: cleanOptions, correct: draft.correct },
    ]);
    setDraft(emptyDraft());
  };

  const removeQuestion = (id) => onQuestionsChange(questions.filter((q) => q.id !== id));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2">
        <label className="text-xs font-semibold text-stone-600">Quiz questions ({questions.length})</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-500">Passing score</span>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => onPassingScoreChange(e.target.value)}
              className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-xs outline-none focus:border-brand-600"
            />
            <span className="text-[11px] text-stone-500">%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer size={12} className="text-stone-400" />
            <input
              type="number"
              min="0"
              value={timeLimitMins || ""}
              onChange={(e) => onTimeLimitChange(e.target.value)}
              placeholder="None"
              title="Time limit in minutes — blank or 0 means untimed"
              className="w-16 rounded-lg border border-stone-200 px-2 py-1 text-xs outline-none focus:border-brand-600"
            />
            <span className="text-[11px] text-stone-500">min limit</span>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {questions.map((q, qi) => {
            const Icon = TYPE_META[q.type]?.Icon || Circle;
            return (
              <div key={q.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                <div className="flex items-start gap-2">
                  <Icon size={13} className="mt-0.5 shrink-0 text-stone-400" />
                  <span className="flex-1 font-medium text-stone-700">
                    {qi + 1}. {q.prompt}
                  </span>
                  <button type="button" onClick={() => removeQuestion(q.id)} className="shrink-0 text-stone-400 hover:text-rose-600">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-1.5 ml-[21px] space-y-0.5">
                  {q.options.map((opt, oi) => (
                    <p key={oi} className={q.correct.includes(oi) ? "font-semibold text-emerald-700" : "text-stone-500"}>
                      {q.correct.includes(oi) ? "✓" : "·"} {opt}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5 rounded-lg border border-dashed border-stone-300 p-3">
        <div className="flex gap-2">
          <input
            value={draft.prompt}
            onChange={(e) => updateDraft("prompt", e.target.value)}
            placeholder="Question prompt"
            className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
          />
          <select
            value={draft.type}
            onChange={(e) => setType(e.target.value)}
            className="shrink-0 rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-brand-600"
          >
            <option value="single">Multiple choice</option>
            <option value="multi">Select all that apply</option>
          </select>
          <button
            type="button"
            onClick={fillTrueFalse}
            title="Quick-fill True / False options"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2 py-1.5 text-[11px] font-semibold text-stone-500 hover:bg-stone-100"
          >
            <ToggleLeft size={13} /> T/F
          </button>
        </div>

        <div className="space-y-1.5">
          {draft.options.map((opt, i) => {
            const marked = draft.correct.includes(i);
            const MarkerIcon = draft.type === "single" ? CheckCircle2 : CheckSquare;
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(i)}
                  title={draft.type === "single" ? "Mark as the correct answer" : "Toggle as a correct answer"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border transition ${
                    draft.type === "single" ? "rounded-full" : "rounded-md"
                  } ${
                    marked ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 text-transparent hover:border-emerald-400"
                  }`}
                >
                  <MarkerIcon size={13} />
                </button>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
                />
                {draft.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="shrink-0 text-stone-400 hover:text-rose-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={addOption} className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline">
            <Plus size={12} /> Add option
          </button>
        </div>

        <p className="text-[10px] text-stone-400">
          Click the {draft.type === "single" ? "circle" : "checkbox"} next to an option to mark it correct.{" "}
          {draft.type === "single" ? "Pick exactly one." : "Pick one or more."}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addQuestion}
            disabled={!canAdd}
            className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ListChecks size={13} /> Add question
          </button>
          {missingReason && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <AlertCircle size={12} /> {missingReason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
