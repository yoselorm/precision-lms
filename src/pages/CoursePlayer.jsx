import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Circle, PlayCircle, FileText, File, HelpCircle, ArrowLeft, Lock, Tag, Trophy, ExternalLink } from "lucide-react";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment, completeModule, enrollUser } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import ProgressBar from "../components/ProgressBar";
import SubmissionUpload from "../components/SubmissionUpload";
import QuizIntroCard from "../components/QuizIntroCard";
import TopicComments from "../components/TopicComments";

const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };

export default function CoursePlayer({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));

  const firstLessonId = course?.topics[0]?.lessons[0]?.id;
  const [activeItemId, setActiveItemId] = useState(firstLessonId);

  // Free courses have no paywall gate to enroll through — auto-enroll on
  // first visit so progress/quiz-score tracking (which needs an enrollment
  // record to write to) works the same way it does for paid courses.
  useEffect(() => {
    if (course && currentUser && course.price === 0 && !enrollment) {
      dispatch(enrollUser({ userId: currentUser.id, courseId: course.id }));
    }
  }, [course, currentUser, enrollment, dispatch]);

  useEffect(() => {
    if (!activeItemId && firstLessonId) setActiveItemId(firstLessonId);
  }, [activeItemId, firstLessonId]);

  const { activeTopic, activeLesson, isQuizActive } = useMemo(() => {
    if (!course) return {};
    for (const topic of course.topics) {
      const lesson = topic.lessons.find((l) => l.id === activeItemId);
      if (lesson) return { activeTopic: topic, activeLesson: lesson, isQuizActive: false };
      if (activeItemId === `${topic.id}__quiz`) return { activeTopic: topic, activeLesson: null, isQuizActive: true };
    }
    return {};
  }, [course, activeItemId]);

  if (!course) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Course not found. <button className="ml-2 underline" onClick={() => navigate("/catalog")}>Back to catalog</button>
      </div>
    );
  }

  // Courses awaiting (or denied) admin approval aren't public — only an
  // admin, or the trainer who authored it, can open the player to preview
  // it while it's still under review.
  const courseStatus = course.status || "approved";
  const canPreviewUnapproved = currentUser?.role === "admin" || (currentUser?.role === "trainer" && course.createdBy === currentUser.id);
  if (courseStatus !== "approved" && !canPreviewUnapproved) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        This course isn't published yet. <button className="ml-2 underline" onClick={() => navigate("/catalog")}>Back to catalog</button>
      </div>
    );
  }

  // Anonymous visitor: the catalog is public, but you need an account to
  // actually enroll in and view a course's material.
  if (!currentUser) {
    return <AuthGate course={course} onBack={() => navigate("/catalog")} />;
  }

  // Paywall: paid course, no enrollment yet, and not an admin previewing it.
  const needsPurchase = course.price > 0 && !enrollment && currentUser.role !== "admin";

  if (needsPurchase) {
    return (
      <PurchaseGate
        course={course}
        onEnroll={() => {
          dispatch(enrollUser({ userId: currentUser.id, courseId: course.id }));
          dispatch(pushToast({ type: "success", message: `Enrolled in "${course.title}".` }));
        }}
        onBack={() => navigate("/catalog")}
      />
    );
  }

  const completedIds = enrollment?.completedModuleIds ?? [];
  const isItemComplete = (id) => completedIds.includes(id);

  const allLessons = course.topics.flatMap((t) => t.lessons);
  const topicsWithQuiz = course.topics.filter((t) => t.quiz?.questions?.length > 0);
  const totalCompletable = allLessons.length + topicsWithQuiz.length;

  const markItemDone = (moduleId) => {
    dispatch(completeModule({ userId: currentUser.id, courseId: course.id, moduleId, totalModules: totalCompletable }));
  };

  const handleMarkComplete = () => {
    markItemDone(activeLesson.id);
    dispatch(pushToast({ type: "success", message: `"${activeLesson.title}" marked as complete.` }));
  };

  const switchItem = (id) => setActiveItemId(id);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-stone-50 lg:flex-row">
      {/* Topic/lesson list */}
      <aside className="flex max-h-64 w-full shrink-0 flex-col overflow-y-auto border-b border-stone-200 bg-white p-4 lg:h-full lg:max-h-none lg:min-h-0 lg:w-80 lg:border-b-0 lg:border-r">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{course.category}</span>
        <h2 className="mb-3 text-base font-bold text-stone-900 leading-snug">{course.title}</h2>
        {courseStatus !== "approved" && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-800">
            Preview only — {courseStatus === "pending" ? "awaiting admin approval" : "denied by an admin"}, not visible to learners yet.
          </p>
        )}
        <ProgressBar value={enrollment?.progress ?? 0} />
        <p className="mb-4 mt-1.5 text-[11px] text-stone-400">{enrollment?.progress ?? 0}% complete</p>

        <div className="space-y-3">
          {course.topics.map((topic) => {
            const hasQuiz = (topic.quiz?.questions?.length ?? 0) > 0;
            const quizId = `${topic.id}__quiz`;
            return (
              <div key={topic.id}>
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">{topic.title}</p>
                <div className="space-y-1">
                  {topic.lessons.map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type] || FileText;
                    const done = isItemComplete(lesson.id);
                    const active = lesson.id === activeItemId;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => switchItem(lesson.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                          active ? "bg-brand-50 text-brand-800 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {done ? <CheckCircle2 size={15} className="shrink-0 text-emerald-600" /> : <Circle size={15} className="shrink-0 text-stone-300" />}
                        <Icon size={13} className="shrink-0 text-stone-400" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-[10px] text-stone-400">{lesson.durationMins}m</span>
                      </button>
                    );
                  })}

                  {hasQuiz && (
                    <button
                      onClick={() => switchItem(quizId)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                        activeItemId === quizId ? "bg-brand-50 text-brand-800 font-semibold" : "text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {isItemComplete(quizId) ? (
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      ) : (
                        <Circle size={15} className="shrink-0 text-stone-300" />
                      )}
                      <HelpCircle size={13} className="shrink-0 text-stone-400" />
                      <span className="flex-1">Knowledge check</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {course.capstone && (
            <button
              onClick={() => switchItem("__capstone__")}
              className={`flex w-full items-center gap-2.5 rounded-lg border border-dashed border-amber-300 px-3 py-2.5 text-left text-xs transition ${
                activeItemId === "__capstone__" ? "bg-amber-50 text-amber-800 font-semibold" : "text-stone-600 hover:bg-amber-50/50"
              }`}
            >
              <Trophy size={15} className="shrink-0 text-amber-500" />
              <span className="flex-1">Capstone: {course.capstone.title}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
        {activeItemId === "__capstone__" && course.capstone && (
          <div className="mx-auto max-w-2xl space-y-5">
            <div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                <Trophy size={12} /> Capstone project
              </span>
              <h1 className="text-xl font-bold text-stone-900">{course.capstone.title}</h1>
            </div>
            <div className="whitespace-pre-line rounded-xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600">
              {course.capstone.instructions}
            </div>
            <SubmissionUpload type="capstone" refId={course.id} userId={currentUser.id} />
          </div>
        )}

        {activeLesson && (
          <div className="mx-auto max-w-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {activeLesson.type === "video" ? "Video" : activeLesson.type === "document" ? "Document" : "Reading"}
              </span>
              <h1 className="text-xl font-bold text-stone-900">{activeLesson.title}</h1>
            </div>

            {activeLesson.type === "video" ? (
              activeLesson.videoUrl ? (
                <video key={activeLesson.id} controls className="aspect-video w-full rounded-xl bg-stone-900">
                  <source src={activeLesson.videoUrl} />
                </video>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-900">
                  <PlayCircle size={56} className="text-white/70" />
                </div>
              )
            ) : activeLesson.type === "document" ? (
              activeLesson.fileUrl ? (
                <a
                  href={activeLesson.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white p-6 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <File size={20} className="shrink-0" /> Open document <ExternalLink size={14} className="ml-auto shrink-0" />
                </a>
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-400">
                  No document has been attached to this lesson yet.
                </div>
              )
            ) : activeLesson.body ? (
              <div className="whitespace-pre-line rounded-xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600">
                {activeLesson.body}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600">
                Placeholder reading content for "{activeLesson.title}" goes here — this is where the real
                article, PDF viewer, or embedded document would render.
              </div>
            )}

            <button
              onClick={handleMarkComplete}
              disabled={isItemComplete(activeLesson.id)}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isItemComplete(activeLesson.id) ? "Completed" : "Mark as complete"}
            </button>

            {activeTopic && <TopicComments courseId={course.id} topicId={activeTopic.id} />}
          </div>
        )}

        {isQuizActive && activeTopic && (
          <div className="mx-auto max-w-2xl space-y-5">
            <QuizIntroCard
              quiz={activeTopic.quiz}
              attempts={enrollment?.topicQuizzes?.[activeTopic.id]?.attempts}
              heading="Knowledge check"
              subheading={activeTopic.title}
              onStart={() => navigate(`/course/${course.id}/topic/${activeTopic.id}/quiz`)}
            />
            <TopicComments courseId={course.id} topicId={activeTopic.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function AuthGate({ course, onBack }) {
  const navigate = useNavigate();
  const goTo = (tab) => navigate("/login", { state: { from: `/course/${course.id}`, tab } });

  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back to catalog
        </button>
        <img src={course.thumbnailImage} alt={course.title} className="mb-4 h-32 w-full rounded-xl object-cover" />
        <div className="mb-2 flex items-center justify-center gap-1.5 text-brand-700">
          <Lock size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Sign in required</span>
        </div>
        <h1 className="text-lg font-bold text-stone-900">{course.title}</h1>
        <p className="mt-1.5 text-sm text-stone-500">Create a free account or log in to enroll and start this course.</p>
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={() => goTo("signup")} className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
            Sign up
          </button>
          <button onClick={() => goTo("login")} className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseGate({ course, onEnroll, onBack }) {
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = () => {
    onEnroll();
    setPurchased(true);
  };

  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back to catalog
        </button>
        <img src={course.thumbnailImage} alt={course.title} className="mb-4 h-32 w-full rounded-xl object-cover" />
        <div className="mb-2 flex items-center justify-center gap-1.5 text-amber-600">
          <Lock size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Paid course</span>
        </div>
        <h1 className="text-lg font-bold text-stone-900">{course.title}</h1>
        <p className="mt-1.5 text-sm text-stone-500">{course.description}</p>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-2xl font-extrabold text-stone-900">
          <Tag size={18} className="text-brand-700" /> GH₵{course.price}
        </p>
        <button
          onClick={handlePurchase}
          disabled={purchased}
          className="mt-5 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {purchased ? "Enrolled — loading course..." : "Enroll & pay (demo)"}
        </button>
        <p className="mt-2 text-[11px] text-stone-400">Demo only — no real payment is processed.</p>
      </div>
    </div>
  );
}
