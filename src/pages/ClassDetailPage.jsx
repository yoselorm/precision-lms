import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Users,
  Settings2,
  Plus,
  ClipboardList,
  FileCheck2,
  Pencil,
  Lock,
  LockOpen,
  HelpCircle,
  ArrowRight,
  UserPlus,
  BookOpen,
} from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import SubmissionUpload from "../components/SubmissionUpload";
import QuizIntroCard from "../components/QuizIntroCard";
import { selectClassById, selectClassQuizAttempts, enrollInClass } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment, enrollUser } from "../store/slices/enrollmentsSlice";
import {
  selectAssignmentsByClass,
  addAssignment,
  updateAssignment,
  setAssignmentStatus,
  isAssignmentClosed,
} from "../store/slices/assignmentsSlice";
import { selectSubmissionsForTarget } from "../store/slices/submissionsSlice";
import { pushToast } from "../store/slices/uiSlice";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  upcoming: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-stone-100 text-stone-500 border-stone-200",
};

// Handles both "set a new assignment" and "edit an existing one" — pass an
// `assignment` to edit it in place, omit it to create a new one for classId.
function AssignmentFormModal({ classId, assignment, onClose }) {
  const dispatch = useDispatch();
  const isEdit = !!assignment;
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [instructions, setInstructions] = useState(assignment?.instructions ?? "");
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? "");
  const [autoCloseOnDueDate, setAutoCloseOnDueDate] = useState(assignment?.autoCloseOnDueDate ?? false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    if (isEdit) {
      dispatch(updateAssignment({ id: assignment.id, title, instructions, dueDate, autoCloseOnDueDate }));
      dispatch(pushToast({ type: "success", message: `"${title}" was updated.` }));
    } else {
      dispatch(addAssignment({ classId, title, instructions, dueDate, autoCloseOnDueDate }));
      dispatch(pushToast({ type: "success", message: `"${title}" was set for the class.` }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">{isEdit ? "Edit assignment" : "Set an assignment"}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Data handling audit"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="What should learners do, and how should they submit it?"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={autoCloseOnDueDate}
              onChange={(e) => setAutoCloseOnDueDate(e.target.checked)}
              className="text-brand-700"
            />
            Automatically close submissions once the due date passes
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            {isEdit ? "Save changes" : "Set assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AssignmentCard({ assignment, canManage, isMember }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const submissions = useSelector((state) => selectSubmissionsForTarget(state, "assignment", assignment.id));
  const users = useSelector(selectAllUsers);
  const [editing, setEditing] = useState(false);
  const closed = isAssignmentClosed(assignment);

  const toggleClosed = () => {
    const nextStatus = closed ? "open" : "closed";
    dispatch(setAssignmentStatus({ id: assignment.id, status: nextStatus }));
    dispatch(
      pushToast({
        type: nextStatus === "closed" ? "info" : "success",
        message: `Submissions ${nextStatus === "closed" ? "closed" : "reopened"} for "${assignment.title}".`,
      })
    );
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-sm font-bold text-stone-900">{assignment.title}</h4>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                closed ? "border-stone-200 bg-stone-100 text-stone-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {closed ? "Closed" : "Open"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">{assignment.instructions}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-stone-400">
          Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      {isMember && !canManage && (
        <div className="mt-3">
          <SubmissionUpload type="assignment" refId={assignment.id} userId={currentUser.id} disabled={closed} />
        </div>
      )}

      {canManage && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
            >
              <Pencil size={11} /> Edit
            </button>
            <button
              onClick={toggleClosed}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                closed ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {closed ? <LockOpen size={11} /> : <Lock size={11} />} {closed ? "Reopen submissions" : "Close submissions"}
            </button>
            {assignment.autoCloseOnDueDate && (
              <span className="flex items-center gap-1 rounded-lg bg-stone-50 px-2.5 py-1.5 text-[10px] font-medium text-stone-400">
                Auto-closes on due date
              </span>
            )}
          </div>

          <div className="mt-3 border-t border-stone-100 pt-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <FileCheck2 size={11} /> Submissions ({submissions.length})
            </p>
            {submissions.length === 0 ? (
              <p className="text-xs text-stone-400">No submissions yet.</p>
            ) : (
              <div className="space-y-1.5">
                {submissions.map((s) => {
                  const student = users.find((u) => u.id === s.userId);
                  return (
                    <a
                      key={s.id}
                      href={s.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs hover:bg-stone-100"
                    >
                      <img src={student?.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                      <span className="font-medium text-stone-700">{student?.name}</span>
                      <span className="ml-auto truncate text-stone-400">{s.fileName}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {editing && <AssignmentFormModal classId={assignment.classId} assignment={assignment} onClose={() => setEditing(false)} />}
    </div>
  );
}

// A quiz that belongs to this specific class (not the shared course quiz) —
// authored from Manage materials, taken right here on the class page.
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
            onClick={() => navigate(`/classes/${cls.id}/manage`)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
          >
            Set one up <ArrowRight size={11} />
          </button>
        </div>
      ) : canManage ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-stone-100 bg-stone-50 p-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {cls.quiz.questions.length} question{cls.quiz.questions.length > 1 ? "s" : ""}
            {cls.quiz.timeLimitMins ? ` · ${cls.quiz.timeLimitMins} min limit` : ""} · passing score {cls.quiz.passingScore}%
          </span>
          <button
            onClick={() => navigate(`/classes/${cls.id}/manage`)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100"
          >
            Edit in Manage materials <ArrowRight size={11} />
          </button>
        </div>
      ) : isMember ? (
        <QuizIntroCard
          quiz={cls.quiz}
          attempts={attempts}
          heading="Class quiz"
          subheading={cls.title}
          onStart={() => navigate(`/classes/${cls.id}/quiz`)}
        />
      ) : (
        <p className="text-xs text-stone-400">Only students in this class can take its quiz.</p>
      )}
    </div>
  );
}

// Averages progress across every course attached to the class — with one
// course this is identical to reading that course's enrollment directly.
function RosterRow({ member, courseIds }) {
  const enrollments = useSelector((state) => courseIds.map((courseId) => selectEnrollment(state, member.id, courseId)));
  const known = enrollments.filter(Boolean);
  const avgProgress = known.length ? Math.round(known.reduce((sum, e) => sum + e.progress, 0) / known.length) : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-100 px-3 py-2.5">
      <img src={member.avatarUrl} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-stone-800">{member.name}</p>
        <p className="text-[10px] text-stone-400">{member.department}</p>
      </div>
      <div className="w-28">
        <ProgressBar value={avgProgress} heightClass="h-1.5" />
      </div>
      <span className="w-10 text-right text-xs font-mono text-stone-500">{avgProgress}%</span>
    </div>
  );
}

export default function ClassDetailPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const cls = useSelector((state) => selectClassById(state, classId));
  const allCourses = useSelector(selectAllCourses);
  const users = useSelector(selectAllUsers);
  const assignments = useSelector((state) => selectAssignmentsByClass(state, classId));
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

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

  const trainer = users.find((u) => u.id === cls.trainerId);
  const members = users.filter((u) => cls.memberIds.includes(u.id));
  const isMember = cls.memberIds.includes(currentUser.id);
  const canManage = currentUser.role === "admin" || currentUser.id === cls.trainerId;
  const classCourses = cls.courses || [];
  const courseIds = classCourses.map((c) => c.courseId);
  const resolvedCourses = classCourses.map((entry) => ({ ...entry, course: allCourses.find((c) => c.id === entry.courseId) })).filter((e) => e.course);
  const canEnroll = !isMember && cls.status !== "completed";

  const handleEnroll = () => {
    setEnrolling(true);
    dispatch(enrollInClass({ classId: cls.id, userId: currentUser.id }));
    courseIds.forEach((courseId) => dispatch(enrollUser({ userId: currentUser.id, courseId })));
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
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} /> {trainer?.name ?? "Unassigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {members.length} learners
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
                  <UserPlus size={13} /> Enroll in this class
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

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-stone-800">
            <Users size={14} /> Students ({members.length})
          </h3>
          <div className="space-y-1.5">
            {members.map((m) => (
              <RosterRow key={m.id} member={m} courseIds={courseIds} />
            ))}
            {members.length === 0 && <p className="text-xs text-stone-400">No students enrolled in this class yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
              <ClipboardList size={14} /> Assignments
            </h3>
            {canManage && (
              <button
                onClick={() => setShowAssignmentForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900"
              >
                <Plus size={13} /> Set assignment
              </button>
            )}
          </div>
          <div className="space-y-3">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} canManage={canManage} isMember={isMember} />
            ))}
            {assignments.length === 0 && <p className="text-xs text-stone-400">No assignments set for this class yet.</p>}
          </div>
        </div>

        <ClassQuizSection cls={cls} canManage={canManage} isMember={isMember} />
      </div>

      {showAssignmentForm && <AssignmentFormModal classId={cls.id} onClose={() => setShowAssignmentForm(false)} />}
    </div>
  );
}
