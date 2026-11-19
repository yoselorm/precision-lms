import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Loader2 } from "lucide-react";
import Header from "../components/Header";
import QuizTaker from "../components/QuizTaker";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment, submitQuizScore } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import { getQuiz } from "../api/courses";
import { normalizeQuiz } from "../api/normalize";
import { quizAttemptHandlers } from "../utils/quizAttempts";
import { quizKey } from "../utils/quiz";

// A course, topic or lesson quiz gets its own focused page — reached from
// the "Start quiz" button on the course player. The URL says which:
// /course/:courseId/quiz, …/topic/:topicId/quiz or …/lesson/:lessonId/quiz.
export default function CourseQuizPage({ onMenuClick }) {
  const { courseId, topicId, lessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const owner = topicId ? { type: "topic", id: topicId } : lessonId ? { type: "lesson", id: lessonId } : { type: "course", id: courseId };

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));

  const topics = course?.revision?.topics ?? course?.topics ?? [];
  const knownTopic = topics.find((t) => t.id === topicId);
  const knownLesson = topics.flatMap((t) => t.lessons).find((l) => l.id === lessonId);
  const ownerTitle = owner.type === "course" ? "Final quiz" : (knownTopic ?? knownLesson)?.title;

  // Load the quiz straight from the URL's owner.
  const [quizState, setQuizState] = useState({ status: "loading", quiz: null });
  const canRead = currentUser?.role === "learner" || currentUser?.role === "trainer";
  useEffect(() => {
    // The quiz route is learner/trainer-only (admins use the Quizzes page).
    if (!canRead) {
      setQuizState({ status: "ready", quiz: null });
      return;
    }
    let cancelled = false;
    getQuiz(owner)
      .then((q) => !cancelled && setQuizState({ status: "ready", quiz: normalizeQuiz(q) }))
      .catch(() => !cancelled && setQuizState({ status: "ready", quiz: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner.type, owner.id, canRead]);
  const quiz = quizState.quiz;
  const key = quizKey(owner);
  const subheading = ownerTitle || quiz?.title || "Quiz";

  const handlers = useMemo(
    () =>
      quiz &&
      quizAttemptHandlers(
        owner.type === "topic" ? { topicId } : owner.type === "lesson" ? { lessonId } : { courseId },
        quiz,
        (message) => dispatch(pushToast({ type: "error", message }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz, owner.type, owner.id, dispatch]
  );

  if (quizState.status === "loading" && course && currentUser) {
    return (
      <div className="flex h-full flex-1 items-center justify-center gap-2 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" /> Loading quiz...
      </div>
    );
  }

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

  const hasQuiz = (quiz?.questions?.length ?? 0) > 0;
  if (!hasQuiz) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        This {owner.type} doesn't have a quiz.{" "}
        <button className="ml-2 underline" onClick={() => navigate(`/course/${courseId}`)}>
          Back to course
        </button>
      </div>
    );
  }

  const handleSubmit = (score, passed, timedOut) => {
    const previousAttempts = enrollment?.topicQuizzes?.[key]?.attempts?.length ?? 0;
    const wasLastAttempt = !!quiz.maxAttempts && previousAttempts + 1 >= quiz.maxAttempts;
    dispatch(submitQuizScore({ userId: currentUser.id, courseId: course.id, topicId: key, score, passingScore: quiz.passingScore, passed }));
    dispatch(
      pushToast({
        type: passed ? "success" : "error",
        message: timedOut
          ? `Time's up — auto-submitted with ${score}% (passing score is ${quiz.passingScore}%).`
          : passed
          ? `Quiz passed with ${score}%!`
          : `Scored ${score}% — passing score is ${quiz.passingScore}%.${wasLastAttempt ? " No attempts left." : " Retry when ready."}`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={owner.type === "course" ? "Final quiz" : "Knowledge check"} subtitle={`${course.title} · ${subheading}`} onMenuClick={onMenuClick} />
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft size={14} /> Back to course
        </button>
        <QuizTaker
          quiz={quiz}
          attempts={enrollment?.topicQuizzes?.[key]?.attempts}
          heading={owner.type === "course" ? "Final quiz" : "Knowledge check"}
          subheading={subheading}
          onSubmit={handleSubmit}
          onBack={() => navigate(`/course/${courseId}`)}
          backLabel="Back to course"
          hasCertificate={!!course.certificate}
          onViewCertificate={() => navigate("/certificates")}
          {...handlers}
        />
      </div>
    </div>
  );
}
