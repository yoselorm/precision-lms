import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import QuizTaker from "../components/QuizTaker";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment, completeModule, submitQuizScore } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";

// A course's quiz gets its own focused page — reached only from the "Start
// quiz" button on the course player (CoursePlayer shows QuizIntroCard for
// the "Knowledge check" module instead of the quiz itself).
export default function CourseQuizPage({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));

  if (!course || !currentUser) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Quiz not found.{" "}
        <button className="ml-2 underline" onClick={() => navigate("/catalog")}>
          Back to catalog
        </button>
      </div>
    );
  }

  const hasQuiz = (course.quiz?.questions?.length ?? 0) > 0;
  if (!hasQuiz) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        This course doesn't have a quiz.{" "}
        <button className="ml-2 underline" onClick={() => navigate(`/course/${courseId}`)}>
          Back to course
        </button>
      </div>
    );
  }

  // Same legacy-vs-synthetic module id logic as CoursePlayer, so completing
  // the quiz here marks the right module done there too.
  const legacyQuizModule = course.modules.find((m) => m.type === "quiz");
  const quizModuleId = legacyQuizModule?.id ?? "__quiz__";
  const totalCompletable = course.modules.length + (!legacyQuizModule ? 1 : 0);
  const isModuleComplete = (id) => (enrollment?.completedModuleIds ?? []).includes(id);

  const handleSubmit = (score, passed, timedOut) => {
    dispatch(submitQuizScore({ userId: currentUser.id, courseId: course.id, score, passingScore: course.quiz.passingScore }));
    if (!isModuleComplete(quizModuleId)) {
      dispatch(completeModule({ userId: currentUser.id, courseId: course.id, moduleId: quizModuleId, totalModules: totalCompletable }));
    }
    dispatch(
      pushToast({
        type: passed ? "success" : "error",
        message: timedOut
          ? `Time's up — auto-submitted with ${score}% (passing score is ${course.quiz.passingScore}%).`
          : passed
          ? `Quiz passed with ${score}%!`
          : `Scored ${score}% — passing score is ${course.quiz.passingScore}%. Retry when ready.`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={legacyQuizModule?.title || "Knowledge check"} subtitle={course.title} onMenuClick={onMenuClick} />
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft size={14} /> Back to course
        </button>
        <QuizTaker
          quiz={course.quiz}
          attempts={enrollment?.quizAttempts}
          heading="Knowledge check"
          subheading={legacyQuizModule?.title || "Knowledge check"}
          onSubmit={handleSubmit}
          onBack={() => navigate(`/course/${courseId}`)}
          backLabel="Back to course"
          hasCertificate={!!course.certificate}
          onViewCertificate={() => navigate("/certificates")}
        />
      </div>
    </div>
  );
}
