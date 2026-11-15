import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Users,
  Settings2,
  ClipboardList,
  HelpCircle,
  ArrowRight,
  UserPlus,
  BookOpen,
  Loader2,
} from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import QuizIntroCard from "../components/QuizIntroCard";
import { selectClassById, selectClassesStatus, selectClassQuizAttempts, fetchClass, joinClass } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { enrollInCourse } from "../store/slices/enrollmentsSlice";
import { selectAssignmentsByClass } from "../store/slices/assignmentsSlice";
import { pushToast } from "../store/slices/uiSlice";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  upcoming: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-stone-100 text-stone-500 border-stone-200",
};

// A quiz that belongs to this specific class (not the shared course quiz) —
// authored on the Quizzes page, taken right here on the class page.
function ClassQuizSection({ cls, canManage, isMember }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const attempts = useSelector((state) => selectClassQuizAttempts(state, cls.id, currentUser.id));
  const hasQuiz = (cls.quiz?.questions?.length ?? 0) > 0;

  if (!hasQuiz && !canManage) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-stone-800">
        <HelpCircle size={14} /> Class quiz
      </h3>

      {!hasQuiz ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-stone-300 p-4 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <span>No quiz set for this class yet — this is separate from the course's own quiz.</span>
          <button
            onClick={() => navigate("/quizzes")}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
          >
            {currentUser.role === "admin" ? "Go to Quizzes" : "Create in Quizzes"} <ArrowRight size={11} />
          </button>
        </div>
      ) : canManage ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-stone-100 bg-stone-50 p-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {cls.quiz.questions.length} question{cls.quiz.questions.length > 1 ? "s" : ""}
            {cls.quiz.timeLimitMins ? ` · ${cls.quiz.timeLimitMins} min limit` : ""} · passing score {cls.quiz.passingScore}%
          </span>
          <button
            onClick={() => navigate("/quizzes")}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100"
          >
            {currentUser.role === "admin" ? "View in Quizzes" : "Edit in Quizzes"} <ArrowRight size={11} />
          </button>
        </div>
      ) : isMember ? (
        <QuizIntroCard
          quiz={cls.quiz}
          attempts={attempts}
          heading={cls.quiz.title || "Class quiz"}
          subheading={cls.title}
          onStart={() => navigate(`/classes/${cls.id}/quiz`)}
        />
      ) : (
        <p className="text-xs text-stone-400">Only students in this class can take its quiz.</p>
      )}
    </div>
  );
}

export default function ClassDetailPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const cls = useSelector((state) => selectClassById(state, classId));
  const classesStatus = useSelector(selectClassesStatus);
  const allCourses = useSelector(selectAllCourses);
  const assignments = useSelector((state) => selectAssignmentsByClass(state, classId));
  const [enrolling, setEnrolling] = useState(false);

  // Detail carries the class's courses and (for members/owner) its quiz.
  useEffect(() => {
    dispatch(fetchClass(classId));
  }, [dispatch, classId]);

  if (!cls && (classesStatus === "idle" || classesStatus === "loading")) {
    return (
      <div className="flex h-full flex-1 items-center justify-center gap-2 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" /> Loading class...
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        Class not found.{" "}
        <button className="ml-2 underline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const isMember = cls.memberIds.includes(currentUser.id);
  const canManage = currentUser.role === "admin" || currentUser.id === cls.trainerId;
  const classCourses = cls.courses || [];
  const courseIds = classCourses.map((c) => c.courseId);
  const resolvedCourses = classCourses.map((entry) => ({ ...entry, course: allCourses.find((c) => c.id === entry.courseId) })).filter((e) => e.course);
  const canEnroll = currentUser.role === "learner" && !isMember && cls.status !== "completed";

  // Joining the class, then enrolling in each of its courses (the API keeps
  // class membership and course enrollment separate).
  const handleEnroll = async () => {
    setEnrolling(true);
    const joined = await dispatch(joinClass({ classId: cls.id }));
    if (joined.error) {
      setEnrolling(false);
      dispatch(pushToast({ type: "error", message: joined.payload || "Couldn't join the class." }));
      return;
    }
    await Promise.all(courseIds.map((courseId) => dispatch(enrollInCourse({ courseId }))));
    dispatch(fetchClass(cls.id));
    dispatch(pushToast({ type: "success", message: `Enrolled in "${cls.title}".` }));
    setEnrolling(false);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title={cls.title}
        subtitle={resolvedCourses.length === 1 ? resolvedCourses[0].course.title : `${resolvedCourses.length} courses`}
        onMenuClick={onMenuClick}
      />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[cls.status]}`}>{cls.status}</span>
                {isMember && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">You're enrolled</span>}
              </div>
              <h2 className="truncate text-base font-bold text-stone-900">{cls.title}</h2>
              {cls.description && <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{cls.description}</p>}
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} /> {cls.trainerName ?? "Unassigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {cls.memberCount} learner{cls.memberCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {canEnroll && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {enrolling ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Enroll in this class
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => navigate(`/classes/${cls.id}/manage`)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Settings2 size={13} /> Manage materials
                </button>
              )}
            </div>
          </div>

          {resolvedCourses.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-stone-100 pt-4">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <BookOpen size={11} /> Courses in this class
              </p>
              {resolvedCourses.map(({ course, mandatory }) => (
                <div key={course.id} className="flex items-center gap-2.5 rounded-lg bg-stone-50 px-3 py-2 text-xs">
                  <img src={course.thumbnailImage} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                  <span className="flex-1 font-medium text-stone-700">{course.title}</span>
                  {mandatory && (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      Mandatory
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The API only exposes a member count, not the roster. */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-stone-800">
            <Users size={14} /> Students ({cls.memberCount})
          </h3>
          <p className="text-xs text-stone-400">
            {cls.memberCount === 0 ? "No students enrolled in this class yet." : "The student roster isn't available yet."}
          </p>
        </div>

        {(canManage || isMember) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                <ClipboardList size={14} /> Assignments
              </h3>
              <p className="mt-0.5 text-xs text-stone-400">
                {assignments.length === 0
                  ? "No assignments for this class yet."
                  : `${assignments.length} assignment${assignments.length === 1 ? "" : "s"} for this class.`}{" "}
                {canManage ? "Create and manage them on the Assignments page." : "View and submit them on your Assignments page."}
              </p>
            </div>
            <button
              onClick={() => navigate("/assignments")}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Go to Assignments <ArrowRight size={13} />
            </button>
          </div>
        )}

        <ClassQuizSection cls={cls} canManage={canManage} isMember={isMember} />
      </div>

    </div>
  );
}
