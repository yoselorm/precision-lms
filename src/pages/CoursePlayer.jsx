import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Circle, PlayCircle, FileText, HelpCircle, ArrowLeft, Award, Lock, Tag, Trophy } from "lucide-react";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment, completeModule, submitQuizScore, enrollUser } from "../store/slices/enrollmentsSlice";
import ProgressBar from "../components/ProgressBar";
import SubmissionUpload from "../components/SubmissionUpload";

const MODULE_ICONS = { video: PlayCircle, reading: FileText, quiz: HelpCircle };

export default function CoursePlayer({ onMenuClick }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const course = useSelector((state) => selectCourseById(state, courseId));
  const currentUser = useSelector(selectCurrentUser);
  const enrollment = useSelector((state) => (currentUser ? selectEnrollment(state, currentUser.id, courseId) : undefined));

  const [activeModuleId, setActiveModuleId] = useState(course?.modules[0]?.id);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const activeModule = useMemo(() => course?.modules.find((m) => m.id === activeModuleId), [course, activeModuleId]);

  if (!course) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Course not found. <button className="ml-2 underline" onClick={() => navigate("/catalog")}>Back to catalog</button>
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
    return <PurchaseGate course={course} onEnroll={() => dispatch(enrollUser({ userId: currentUser.id, courseId: course.id }))} onBack={() => navigate("/catalog")} />;
  }

  const completedIds = enrollment?.completedModuleIds ?? [];
  const isModuleComplete = (id) => completedIds.includes(id);

  const markModuleDone = () => {
    dispatch(completeModule({ userId: currentUser.id, courseId: course.id, moduleId: activeModule.id, totalModules: course.modules.length }));
  };

  const handleQuizSubmit = () => {
    const total = course.quiz.questions.length;
    const correct = course.quiz.questions.filter((q) => quizAnswers[q.id] === q.answerIndex).length;
    const score = Math.round((correct / total) * 100);
    dispatch(submitQuizScore({ userId: currentUser.id, courseId: course.id, score }));
    setQuizSubmitted(true);
    if (!isModuleComplete(activeModule.id)) {
      markModuleDone();
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-stone-50 lg:flex-row">
      {/* Module list */}
      <aside className="flex max-h-64 w-full shrink-0 flex-col overflow-y-auto border-b border-stone-200 bg-white p-4 lg:h-full lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{course.category}</span>
        <h2 className="mb-3 text-base font-bold text-stone-900 leading-snug">{course.title}</h2>
        <ProgressBar value={enrollment?.progress ?? 0} />
        <p className="mb-4 mt-1.5 text-[11px] text-stone-400">{enrollment?.progress ?? 0}% complete</p>

        <div className="space-y-1">
          {course.modules.map((mod) => {
            const Icon = MODULE_ICONS[mod.type] || FileText;
            const done = isModuleComplete(mod.id);
            const active = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModuleId(mod.id);
                  setQuizSubmitted(false);
                  setQuizAnswers({});
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                  active ? "bg-brand-50 text-brand-800 font-semibold" : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {done ? <CheckCircle2 size={15} className="shrink-0 text-emerald-600" /> : <Circle size={15} className="shrink-0 text-stone-300" />}
                <Icon size={13} className="shrink-0 text-stone-400" />
                <span className="flex-1">{mod.title}</span>
                <span className="text-[10px] text-stone-400">{mod.durationMins}m</span>
              </button>
            );
          })}

          {course.capstone && (
            <button
              onClick={() => {
                setActiveModuleId("__capstone__");
                setQuizSubmitted(false);
                setQuizAnswers({});
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg border border-dashed border-amber-300 px-3 py-2.5 text-left text-xs transition ${
                activeModuleId === "__capstone__" ? "bg-amber-50 text-amber-800 font-semibold" : "text-stone-600 hover:bg-amber-50/50"
              }`}
            >
              <Trophy size={15} className="shrink-0 text-amber-500" />
              <span className="flex-1">Capstone: {course.capstone.title}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {activeModuleId === "__capstone__" && course.capstone && (
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

        {activeModuleId !== "__capstone__" && activeModule?.type !== "quiz" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {activeModule?.type === "video" ? "Video" : "Reading"}
              </span>
              <h1 className="text-xl font-bold text-stone-900">{activeModule?.title}</h1>
            </div>

            {activeModule?.type === "video" ? (
              activeModule.videoUrl ? (
                <video key={activeModule.id} controls className="aspect-video w-full rounded-xl bg-stone-900">
                  <source src={activeModule.videoUrl} />
                </video>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-900">
                  <PlayCircle size={56} className="text-white/70" />
                </div>
              )
            ) : activeModule?.body ? (
              <div className="whitespace-pre-line rounded-xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600">
                {activeModule.body}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600">
                Placeholder reading content for "{activeModule?.title}" goes here — this is where the real
                article, PDF viewer, or embedded document would render.
              </div>
            )}

            <button
              onClick={markModuleDone}
              disabled={isModuleComplete(activeModule?.id)}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isModuleComplete(activeModule?.id) ? "Completed" : "Mark as complete"}
            </button>
          </div>
        )}

        {activeModule?.type === "quiz" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Knowledge check</span>
              <h1 className="text-xl font-bold text-stone-900">{activeModule.title}</h1>
              <p className="text-xs text-stone-400">Passing score: {course.quiz.passingScore}%</p>
            </div>

            {!quizSubmitted ? (
              <div className="space-y-5">
                {course.quiz.questions.map((q, qi) => (
                  <div key={q.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-stone-800">
                      {qi + 1}. {q.prompt}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition ${
                            quizAnswers[q.id] === oi ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:bg-stone-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={quizAnswers[q.id] === oi}
                            onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                            className="text-brand-700"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < course.quiz.questions.length}
                  className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit answers
                </button>
              </div>
            ) : (
              <QuizResult
                score={enrollment?.quizScore ?? 0}
                passingScore={course.quiz.passingScore}
                onBackToCatalog={() => navigate("/catalog")}
                hasCertificate={!!course.certificate}
                onViewCertificate={() => navigate("/certificates")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizResult({ score, passingScore, onBackToCatalog, hasCertificate, onViewCertificate }) {
  const passed = score >= passingScore;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 text-center sm:p-8">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          passed ? "bg-emerald-50" : "bg-rose-50"
        }`}
      >
        <Award size={32} className={passed ? "text-emerald-600" : "text-rose-500"} />
      </div>
      <h2 className="text-lg font-bold text-stone-900">{passed ? "You passed!" : "Not quite there"}</h2>
      <p className="mb-4 text-sm text-stone-500">
        You scored <strong>{score}%</strong> — passing score is {passingScore}%.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={onBackToCatalog} className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
          Back to catalog
        </button>
        {passed && hasCertificate && (
          <button onClick={onViewCertificate} className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            View certificate
          </button>
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
