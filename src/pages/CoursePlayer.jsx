import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Circle, PlayCircle, FileText, File, HelpCircle, ArrowLeft, ArrowRight, Lock, Tag, ExternalLink, Paperclip, Download, Layers, Clock, Award, Eye, Loader2, X } from "lucide-react";
import { selectCourseById, selectCoursesStatus, fetchCourseContent } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAssignmentsByCourse } from "../store/slices/assignmentsSlice";
import { selectEnrollment, enrollInCourse, completeLesson } from "../store/slices/enrollmentsSlice";
import { useApiAction } from "../hooks/useApiAction";
import ProgressBar from "../components/ProgressBar";
import QuizIntroCard from "../components/QuizIntroCard";
import QuizPreview from "../components/QuizPreview";
import { RichText } from "../components/RichTextEditor";
import { formatFileSize } from "../components/LessonListEditor";
import TopicComments from "../components/TopicComments";
import GuardedVideo from "../components/GuardedVideo";
import { pushToast } from "../store/slices/uiSlice";
import { COMPLETE_SHARE } from "../utils/watchProgress";
import { usePageData } from "../hooks/usePageData";
import { loadCoursePage } from "../store/loadAppData";

const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };
const NO_IDS = [];
const COMPLETE_PCT = Math.round(COMPLETE_SHARE * 100);

// "Next lesson in 3…" after a video ends — goes on its own unless cancelled.
function NextUpCountdown({ title, onGo, onCancel }) {
  const [seconds, setSeconds] = useState(3);
  useEffect(() => {
    if (seconds <= 0) {
      onGo();
      return undefined;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      <span className="min-w-0 flex-1 text-brand-900">
        Up next: <strong>{title}</strong> in {seconds}…
      </span>
      <button onClick={onGo} className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
        Go now <ArrowRight size={12} />
      </button>
      <button onClick={onCancel} title="Stay on this lesson" className="shrink-0 rounded-lg p-1.5 text-brand-700 hover:bg-brand-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function CoursePlayer({ onMenuClick }) {
  usePageData(loadCoursePage, { publicPage: true });
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const coursesStatus = useSelector(selectCoursesStatus);
  const currentUser = useSelector(selectCurrentUser);
  const [run, busy] = useApiAction();
  const courseLoaded = !!course;

  useEffect(() => {
    if (courseLoaded && currentUser) dispatch(fetchCourseContent(courseId));
  }, [dispatch, courseId, courseLoaded, currentUser]);

  // A trainer only sees their live course's content through an open update.
  const topics = course ? course.revision?.topics ?? course.topics : [];
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));
  const courseAssignments = useSelector((state) => selectAssignmentsByCourse(state, courseId));

  // Every item in play order: each topic's lessons, then its quiz.
  const items = useMemo(
    () =>
      topics.flatMap((t) => [
        ...t.lessons.map((l) => ({ id: l.id, kind: "lesson", title: l.title })),
        ...(t.quiz?.questions?.length ? [{ id: `${t.id}__quiz`, kind: "quiz", title: "Knowledge check" }] : []),
      ]),
    [topics]
  );
  const completedIds = enrollment?.completedModuleIds ?? NO_IDS;
  // Open at the first unfinished lesson, so learners pick up where they left off.
  const startItemId = useMemo(
    () => (items.find((i) => i.kind === "lesson" && !completedIds.includes(i.id)) ?? items[0])?.id,
    [items, completedIds]
  );
  const [activeItemId, setActiveItemId] = useState(null);
  useEffect(() => {
    if (!activeItemId && startItemId) setActiveItemId(startItemId);
  }, [activeItemId, startItemId]);

  // Video watch state for the guard rails (see GuardedVideo).
  const [watchPct, setWatchPct] = useState({});
  const [eligibleIds, setEligibleIds] = useState([]);
  const [nextUpId, setNextUpId] = useState(null);

  const { activeTopic, activeLesson, isQuizActive } = useMemo(() => {
    if (!course) return {};
    for (const topic of topics) {
      const lesson = topic.lessons.find((l) => l.id === activeItemId);
      if (lesson) return { activeTopic: topic, activeLesson: lesson, isQuizActive: false };
      if (activeItemId === `${topic.id}__quiz`) return { activeTopic: topic, activeLesson: null, isQuizActive: true };
    }
    return {};
  }, [course, topics, activeItemId]);

  if (!course && (coursesStatus === "idle" || coursesStatus === "loading")) {
    return (
      <div className="flex h-full flex-1 items-center justify-center gap-2 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" /> Loading course...
      </div>
    );
  }

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
  const courseStatus = course.status;
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
  // Enrolled learners also land here while the server can't hand them the
  // course's lessons (no learner-facing content endpoint yet).
  const contentUnavailable = course.contentStatus === "unavailable";
  if ((!enrollment && !canPreviewUnapproved) || (enrollment && contentUnavailable)) {
    return (
      <CourseOverview
        course={course}
        topics={topics}
        currentUser={currentUser}
        enrollment={enrollment}
        enrolling={busy}
        onEnroll={() => run(enrollInCourse({ courseId: course.id }), { successMessage: `Enrolled in "${course.title}".` })}
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate("/catalog"))}
      />
    );
  }

  const learnerMode = isLearner && !!enrollment;
  const isItemComplete = (id) => completedIds.includes(id);

  // Lessons unlock in order: each needs every earlier lesson finished. A
  // topic's quiz opens once the lessons before it are done — quiz results
  // aren't stored server-side, so they don't gate what comes after.
  const isUnlocked = (id) => {
    if (!learnerMode) return true;
    const index = items.findIndex((i) => i.id === id);
    return items.slice(0, index).every((i) => i.kind !== "lesson" || completedIds.includes(i.id));
  };
  const nextItemAfter = (id) => items[items.findIndex((i) => i.id === id) + 1] ?? null;

  const switchItem = (id) => {
    if (!isUnlocked(id)) {
      dispatch(pushToast({ type: "info", message: "Finish the previous lesson first to unlock this one." }));
      return;
    }
    setNextUpId(null);
    setActiveItemId(id);
  };

  // Progress is recomputed server-side from completed lessons.
  const completeActive = (lesson, successMessage) =>
    run(completeLesson({ enrollmentId: enrollment.id, lessonId: lesson.id }), { successMessage });

  const handleMarkComplete = () => completeActive(activeLesson, `"${activeLesson.title}" marked as complete.`);

  // Enough of the video watched: complete it right away (green tick).
  const handleEligible = (lesson) => {
    setEligibleIds((ids) => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]));
    if (learnerMode && !isItemComplete(lesson.id)) completeActive(lesson, `"${lesson.title}" completed.`);
  };

  // Video finished: move on if it counts as watched, otherwise say why not.
  const handleVideoEnded = (lesson, share) => {
    const watched = !learnerMode || isItemComplete(lesson.id) || share >= COMPLETE_SHARE;
    if (!watched) {
      dispatch(
        pushToast({
          type: "info",
          message: `Watch at least ${COMPLETE_PCT}% of this video to complete it — you've watched ${Math.floor(share * 100)}%.`,
        })
      );
      return;
    }
    const next = nextItemAfter(lesson.id);
    if (next) setNextUpId(next.id);
    else if (learnerMode) dispatch(pushToast({ type: "success", message: "That's the last lesson in this course — well done!" }));
  };

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
          {course.contentStatus === "loading" && (
            <p className="flex items-center gap-1.5 px-1 text-xs text-stone-400">
              <Loader2 size={13} className="animate-spin" /> Loading content...
            </p>
          )}
          {course.contentStatus === "succeeded" && topics.length === 0 && (
            <p className="px-1 text-xs text-stone-400">
              {course.status === "approved" && course.createdBy === currentUser?.id
                ? "Start an update from the course page to see and edit this live course's content."
                : "No topics yet."}
            </p>
          )}
          {topics.map((topic) => {
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
                    const locked = !isUnlocked(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => switchItem(lesson.id)}
                        title={locked ? "Finish the previous lesson to unlock" : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                          active
                            ? "bg-brand-50 text-brand-800 font-semibold"
                            : locked
                            ? "cursor-not-allowed text-stone-400"
                            : "text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                        ) : locked ? (
                          <Lock size={14} className="shrink-0 text-stone-300" />
                        ) : (
                          <Circle size={15} className="shrink-0 text-stone-300" />
                        )}
                        <Icon size={13} className="shrink-0 text-stone-400" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-[10px] text-stone-400">{lesson.durationMins}m</span>
                      </button>
                    );
                  })}

                  {hasQuiz && (
                    <button
                      onClick={() => switchItem(quizId)}
                      title={!isUnlocked(quizId) ? "Finish this topic's lessons to unlock" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                        activeItemId === quizId
                          ? "bg-brand-50 text-brand-800 font-semibold"
                          : !isUnlocked(quizId)
                          ? "cursor-not-allowed text-stone-400"
                          : "text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {isItemComplete(quizId) ? (
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      ) : !isUnlocked(quizId) ? (
                        <Lock size={14} className="shrink-0 text-stone-300" />
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
              {activeLesson.description && <p className="mt-1 text-sm text-stone-500">{activeLesson.description}</p>}
            </div>

            {nextUpId && nextItemAfter(activeLesson.id)?.id === nextUpId && (
              <NextUpCountdown
                title={nextItemAfter(activeLesson.id).title}
                onGo={() => switchItem(nextUpId)}
                onCancel={() => setNextUpId(null)}
              />
            )}

            {activeLesson.type === "video" ? (
              activeLesson.videoUrl ? (
                <GuardedVideo
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  userId={currentUser?.id}
                  lessonId={activeLesson.id}
                  guard={learnerMode && !isItemComplete(activeLesson.id)}
                  onProgress={(pct) => setWatchPct((prev) => ({ ...prev, [activeLesson.id]: pct }))}
                  onEligible={() => handleEligible(activeLesson)}
                  onEnded={(share) => handleVideoEnded(activeLesson, share)}
                />
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

            {activeLesson.resources?.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">
                  <Paperclip size={12} /> Resources
                </h2>
                <ul className="space-y-1.5">
                  {activeLesson.resources.map((r, i) => (
                    <li key={`${r.url}-${i}`}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        download={r.name}
                        className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-brand-50 hover:text-brand-800"
                      >
                        <Download size={13} className="shrink-0 text-brand-700" />
                        <span className="flex-1 truncate">{r.name}</span>
                        {r.size > 0 && <span className="shrink-0 text-[10px] text-stone-400">{formatFileSize(r.size)}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learnerMode && (() => {
              const done = isItemComplete(activeLesson.id);
              // Uploaded/linked videos complete by watching; other lessons by hand.
              const watchGated = activeLesson.type === "video" && !!activeLesson.videoUrl;
              const canComplete = !watchGated || eligibleIds.includes(activeLesson.id);
              const next = nextItemAfter(activeLesson.id);
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleMarkComplete}
                    disabled={busy || done || !canComplete}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {done && <CheckCircle2 size={15} />}
                    {done
                      ? "Completed"
                      : canComplete
                      ? "Mark as complete"
                      : `Watch ${COMPLETE_PCT}% to complete · ${watchPct[activeLesson.id] ?? 0}% watched`}
                  </button>
                  {done && next && (
                    <button
                      onClick={() => switchItem(next.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Next: {next.title} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              );
            })()}

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
// Enroll button. Enrolled learners see it too while the course's materials
// can't be loaded from the server.
function CourseOverview({ course, topics, currentUser, enrollment, enrolling, onEnroll, onBack }) {
  const navigate = useNavigate();
  const goTo = (tab) => navigate("/login", { state: { from: `/course/${course.id}`, tab } });
  const handleEnroll = () => onEnroll();
  const topicsKnown = course.contentStatus === "succeeded";

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-stone-50">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {course.demoVideoUrl ? (
                <video controls poster={course.thumbnailImage} className="aspect-video w-full bg-stone-900">
                  <source src={course.demoVideoUrl} />
                </video>
              ) : (
                <img src={course.thumbnailImage} alt={course.title} className="h-48 w-full object-cover sm:h-60" />
              )}
              <div className="p-5 sm:p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{course.category}</span>
                <h1 className="mt-1 text-xl font-bold text-stone-900 sm:text-2xl">{course.title}</h1>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500">
                  {topicsKnown && (
                    <span className="flex items-center gap-1">
                      <Layers size={13} /> {topics.length} {topics.length === 1 ? "topic" : "topics"}
                    </span>
                  )}
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
                {course.description ? (
                  <RichText html={course.description} className="mt-1.5 text-sm leading-relaxed text-stone-600" />
                ) : (
                  <p className="mt-1.5 text-sm text-stone-400">No description has been added for this course yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold text-stone-800">Topics covered</h2>
              <p className="mt-0.5 text-xs text-stone-400">
                {enrollment
                  ? "You're enrolled. The course materials aren't available from the server yet — check back soon."
                  : "Enroll to unlock the course materials."}
              </p>
              <ol className="mt-4 divide-y divide-stone-100">
                {topics.map((topic, i) => (
                  <li key={topic.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800">{topic.title}</p>
                      {topic.description && <p className="mt-0.5 text-xs text-stone-500">{topic.description}</p>}
                    </div>
                    <Lock size={13} className="shrink-0 text-stone-300" />
                  </li>
                ))}
                {topics.length === 0 && (
                  <li className="py-3 text-xs text-stone-400">
                    {/* Topic lists aren't public — only say "coming soon" when we actually know there are none. */}
                    {topicsKnown ? "Topics are coming soon." : "The topic list isn't shown before you enroll."}
                  </li>
                )}
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
              ) : currentUser.role === "learner" && enrollment ? (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={14} /> You're enrolled · {enrollment.progress}% complete
                </p>
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
