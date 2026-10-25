import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import QuizTaker from "../components/QuizTaker";
import { selectClassById, selectClassQuizAttempts, submitClassQuizAttempt } from "../store/slices/classesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";

// A class's own quiz (separate from the course's) gets its own focused page
// too — reached only from the "Start quiz" button on the class detail page.
export default function ClassQuizPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cls = useSelector((state) => selectClassById(state, classId));
  const currentUser = useSelector(selectCurrentUser);
  const attempts = useSelector((state) => (currentUser ? selectClassQuizAttempts(state, classId, currentUser.id) : []));

  if (!cls || !currentUser) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Quiz not found.{" "}
        <button className="ml-2 underline" onClick={() => navigate("/classes")}>
          Back to classes
        </button>
      </div>
    );
  }

  const isMember = cls.memberIds.includes(currentUser.id);
  const hasQuiz = (cls.quiz?.questions?.length ?? 0) > 0;

  if (!isMember || !hasQuiz) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        {!isMember ? "You're not a member of this class." : "This class doesn't have a quiz."}{" "}
        <button className="ml-2 underline" onClick={() => navigate(`/classes/${classId}`)}>
          Back to class
        </button>
      </div>
    );
  }

  const handleSubmit = (score, passed) => {
    const wasLastAttempt = !!cls.quiz.maxAttempts && attempts.length + 1 >= cls.quiz.maxAttempts;
    dispatch(submitClassQuizAttempt({ classId: cls.id, userId: currentUser.id, score, passingScore: cls.quiz.passingScore }));
    dispatch(
      pushToast({
        type: passed ? "success" : "error",
        message: passed ? `Class quiz passed with ${score}%!` : `Scored ${score}% — passing score is ${cls.quiz.passingScore}%.${wasLastAttempt ? " No attempts left." : " Retry when ready."}`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Class quiz" subtitle={cls.title} onMenuClick={onMenuClick} />
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(`/classes/${classId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft size={14} /> Back to class
        </button>
        <QuizTaker
          quiz={cls.quiz}
          attempts={attempts}
          heading={cls.quiz.title || "Class quiz"}
          subheading={cls.title}
          onSubmit={handleSubmit}
          onBack={() => navigate(`/classes/${classId}`)}
          backLabel="Back to class"
        />
      </div>
    </div>
  );
}
