import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Circle, PlayCircle, FileText, File, HelpCircle, ArrowLeft, Lock, Tag, ExternalLink, Layers, Clock, Award, Eye } from "lucide-react";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAssignmentsByCourse } from "../store/slices/assignmentsSlice";
import { selectEnrollment, completeModule, enrollUser } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import ProgressBar from "../components/ProgressBar";
import QuizIntroCard from "../components/QuizIntroCard";
import QuizPreview from "../components/QuizPreview";
import TopicComments from "../components/TopicComments";

const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };

export default function CoursePlayer({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));
  const courseAssignments = useSelector((state) => selectAssignmentsByCourse(state, courseId));

  const firstLessonId = course?.topics[0]?.lessons[0]?.id;
  const [activeItemId, setActiveItemId] = useState(firstLessonId);

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

  // Until someone is enrolled they only get the overview (description +
  // topic titles). Only learners can enroll; admins and the course's own
  // trainer can open the full player as a read-only preview.
  const isLearner = currentUser?.role === "learner";
  if (!enrollment && !canPreviewUnapproved) {
    return (
      <CourseOverview
        course={course}
        currentUser={currentUser}
        onEnroll={() => {
          dispatch(enrollUser({ userId: currentUser.id, courseId: course.id }));
          dispatch(pushToast({ type: "success", message: `Enrolled in "${course.title}".` }));
        }}
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate("/catalog"))}
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
        {courseStatus !== "approved" ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-800">
            Preview only —{" "}
            {courseStatus === "draft" ? "still a draft" : courseStatus === "pending" ? "awaiting admin approval" : "denied by an admin"}, not
            visible to learners yet.
          </p>
        ) : (
          !isLearner && (
            <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600">
              <Eye size={12} className="shrink-0" /> Preview mode — only learners enroll and track progress.
            </p>
          )
        )}
        {isLearner && (
          <>
            <ProgressBar value={enrollment?.progress ?? 0} />
            <p className="mb-4 mt-1.5 text-[11px] text-stone-400">{enrollment?.progress ?? 0}% complete</p>
          </>
        )}

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

          {courseAssignments.length > 0 && (
            <button
              onClick={() => navigate("/assignments")}
              className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 px-3 py-2.5 text-left text-xs text-stone-600 transition hover:bg-stone-50"
            >
              <FileText size={15} className="shrink-0 text-brand-700" />
              <span className="flex-1">
                {courseAssignments.length} assignment{courseAssignments.length === 1 ? "" : "s"}
              </span>
              <span className="text-[10px] font-semibold text-brand-700">{isLearner ? "Submit" : "Manage"}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
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

            {isLearner && (
              <button
                onClick={handleMarkComplete}
                disabled={isItemComplete(activeLesson.id)}
                className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isItemComplete(activeLesson.id) ? "Completed" : "Mark as complete"}
              </button>
            )}

            {activeTopic && <TopicComments courseId={course.id} topicId={activeTopic.id} />}
          </div>
        )}

        {isQuizActive && activeTopic && (
          <div className="mx-auto max-w-2xl space-y-5">
            {isLearner ? (
              <QuizIntroCard
                quiz={activeTopic.quiz}
                attempts={enrollment?.topicQuizzes?.[activeTopic.id]?.attempts}
                heading={activeTopic.quiz.title || "Knowledge check"}
                subheading={activeTopic.title}
                onStart={() => navigate(`/course/${course.id}/topic/${activeTopic.id}/quiz`)}
              />
            ) : (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Quiz preview · answers shown</span>
                <h1 className="mb-4 text-xl font-bold text-stone-900">{activeTopic.quiz.title || "Knowledge check"}</h1>
                <QuizPreview quiz={activeTopic.quiz} />
              </div>
            )}
            <TopicComments courseId={course.id} topicId={activeTopic.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// Pre-enrollment view: description and topic titles only — no lessons,
// videos, quizzes or assignments. Anyone can see it; only learners get an
// Enroll button.
function CourseOverview({ course, currentUser, onEnroll, onBack }) {
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const goTo = (tab) => navigate("/login", { state: { from: `/course/${course.id}`, tab } });

  const handleEnroll = () => {
    setEnrolling(true);
    onEnroll();
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-stone-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <img src={course.thumbnailImage} alt={course.title} className="h-48 w-full object-cover sm:h-60" />
              <div className="p-5 sm:p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{course.category}</span>
                <h1 className="mt-1 text-xl font-bold text-stone-900 sm:text-2xl">{course.title}</h1>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Layers size={13} /> {course.topics.length} {course.topics.length === 1 ? "topic" : "topics"}
                  </span>
                  {course.durationMins > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {course.durationMins} min
                    </span>
                  )}
                  {course.certificate && (
                    <span className="flex items-center gap-1">
                      <Award size={13} /> Certificate on completion
                    </span>
                  )}
                </div>
                <h2 className="mt-5 text-sm font-bold text-stone-800">About this course</h2>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                  {course.description || "No description has been added for this course yet."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold text-stone-800">Topics covered</h2>
              <p className="mt-0.5 text-xs text-stone-400">Enroll to unlock the course materials.</p>
              <ol className="mt-4 divide-y divide-stone-100">
                {course.topics.map((topic, i) => (
                  <li key={topic.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-semibold text-stone-800">{topic.title}</p>
                    <Lock size={13} className="shrink-0 text-stone-300" />
                  </li>
                ))}
                {course.topics.length === 0 && <li className="py-3 text-xs text-stone-400">Topics are coming soon.</li>}
              </ol>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-0">
              <p className="flex items-center gap-1.5 text-2xl font-extrabold text-stone-900">
                {course.price > 0 ? (
                  <>
                    <Tag size={18} className="text-brand-700" /> GH₵{course.price}
                  </>
                ) : (
                  "Free"
                )}
              </p>

              {!currentUser ? (
                <>
                  <p className="mt-1.5 text-xs text-stone-500">Create a free learner account or log in to enroll.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => goTo("signup")} className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
                      Sign up to enroll
                    </button>
                    <button onClick={() => goTo("login")} className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
                      Log in
                    </button>
                  </div>
                </>
              ) : currentUser.role === "learner" ? (
                <>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="mt-4 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrolling ? "Enrolling..." : course.price > 0 ? "Enroll & pay (demo)" : "Enroll for free"}
                  </button>
                  {course.price > 0 && <p className="mt-2 text-[11px] text-stone-400">Demo only — no real payment is processed.</p>}
                </>
              ) : (
                <p className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-600">
                  Only learner accounts can enroll in courses.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
