import React, { useState } from "react";
import { X } from "lucide-react";
import QuizBuilder from "./QuizBuilder";

// Shared "author/edit a quiz" modal — target-agnostic (a course's shared
// quiz, or a single class's own quiz). The caller supplies the starting
// `quiz` and an `onSave(payload)` that dispatches wherever it belongs.
export default function QuizManageModal({ title = "Manage quiz", subtitle, quiz, onSave, onClose }) {
  const [passingScore, setPassingScore] = useState(quiz?.passingScore || 70);
  const [timeLimitMins, setTimeLimitMins] = useState(quiz?.timeLimitMins || "");
  const [quizQuestions, setQuizQuestions] = useState(quiz?.questions || []);

  const handleSave = () => {
    onSave({ passingScore, timeLimitMins, questions: quizQuestions });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">{title}</h2>
            {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <QuizBuilder
          passingScore={passingScore}
          onPassingScoreChange={setPassingScore}
          timeLimitMins={timeLimitMins}
          onTimeLimitChange={setTimeLimitMins}
          questions={quizQuestions}
          onQuestionsChange={setQuizQuestions}
        />

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Save quiz
          </button>
        </div>
      </div>
    </div>
  );
}
