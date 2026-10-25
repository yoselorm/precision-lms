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

// A topic's quiz gets its own focused page — reached only from the "Start
// quiz" button on the course player (CoursePlayer shows QuizIntroCard for
// the "Knowledge check" item instead of the quiz itself).
export default function CourseQuizPage({ onMenuClick }) {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));

  const topic = course?.topics.find((t) => t.id === topicId);

  if (!course || !currentUser || !topic) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Quiz not found.{" "}
        <button className="ml-2 underline" onClick={() => navigate("/catalog")}>
          Back to catalog
        </button>
      </div>
    );
  }

  // Taking a quiz is a learner action, and only for courses they're enrolled in.
  if (currentUser.role !== "learner" || !enrollment) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        {currentUser.role === "learner" ? "Enroll in this course to take its quizzes." : "Only enrolled learners can take quizzes."}{" "}
        <button className="ml-2 underline" onClick={() => navigate(`/course/${courseId}`)}>
          Back to course
        </button>
      </div>
    );
  }

  const hasQuiz = (topic.quiz?.questions?.length ?? 0) > 0;
  if (!hasQuiz) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        This topic doesn't have a quiz.{" "}
        <button className="ml-2 underline" onClick={() => navigate(`/course/${courseId}`)}>
          Back to course
        </button>
      </div>
    );
  }

  const quizItemId = `${topic.id}__quiz`;
  const allLessons = course.topics.flatMap((t) => t.lessons);
  const topicsWithQuiz = course.topics.filter((t) => t.quiz?.questions?.length > 0);
  const totalCompletable = allLessons.length + topicsWithQuiz.length;
  const isItemComplete = (id) => (enrollment?.completedModuleIds ?? []).includes(id);

  const handleSubmit = (score, passed, timedOut) => {
    const previousAttempts = enrollment?.topicQuizzes?.[topic.id]?.attempts?.length ?? 0;
    const wasLastAttempt = !!topic.quiz.maxAttempts && previousAttempts + 1 >= topic.quiz.maxAttempts;
    dispatch(submitQuizScore({ userId: currentUser.id, courseId: course.id, topicId: topic.id, score, passingScore: topic.quiz.passingScore }));
    if (!isItemComplete(quizItemId)) {
      dispatch(completeModule({ userId: currentUser.id, courseId: course.id, moduleId: quizItemId, totalModules: totalCompletable }));
    }
    dispatch(
      pushToast({
        type: passed ? "success" : "error",
        message: timedOut
          ? `Time's up — auto-submitted with ${score}% (passing score is ${topic.quiz.passingScore}%).`
          : passed
          ? `Quiz passed with ${score}%!`
          : `Scored ${score}% — passing score is ${topic.quiz.passingScore}%.${wasLastAttempt ? " No attempts left." : " Retry when ready."}`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Knowledge check" subtitle={`${course.title} · ${topic.title}`} onMenuClick={onMenuClick} />
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft size={14} /> Back to course
        </button>
        <QuizTaker
          quiz={topic.quiz}
          attempts={enrollment?.topicQuizzes?.[topic.id]?.attempts}
          heading="Knowledge check"
          subheading={topic.title}
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
