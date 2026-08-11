import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CalendarDays, GraduationCap, Users, Settings2, Plus, ClipboardList, FileCheck2 } from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import SubmissionUpload from "../components/SubmissionUpload";
import { selectClassById } from "../store/slices/classesSlice";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectEnrollment } from "../store/slices/enrollmentsSlice";
import { selectAssignmentsByClass, addAssignment } from "../store/slices/assignmentsSlice";
import { selectSubmissionsForTarget } from "../store/slices/submissionsSlice";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  upcoming: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-stone-100 text-stone-500 border-stone-200",
};

function AssignmentFormModal({ classId, onClose }) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    dispatch(addAssignment({ classId, title, instructions, dueDate }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Set an assignment</h2>
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
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Set assignment
          </button>
        </div>
      </form>
    </div>
  );
}

function AssignmentCard({ assignment, canManage, isMember }) {
  const currentUser = useSelector(selectCurrentUser);
  const submissions = useSelector((state) => selectSubmissionsForTarget(state, "assignment", assignment.id));
  const users = useSelector(selectAllUsers);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-stone-900">{assignment.title}</h4>
          <p className="mt-0.5 text-xs text-stone-500">{assignment.instructions}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-stone-400">
          Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      {isMember && !canManage && (
        <div className="mt-3">
          <SubmissionUpload type="assignment" refId={assignment.id} userId={currentUser.id} />
        </div>
      )}

      {canManage && (
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
      )}
    </div>
  );
}

function RosterRow({ member, courseId }) {
  const enrollment = useSelector((state) => selectEnrollment(state, member.id, courseId));
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-100 px-3 py-2.5">
      <img src={member.avatarUrl} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-stone-800">{member.name}</p>
        <p className="text-[10px] text-stone-400">{member.department}</p>
      </div>
      <div className="w-28">
        <ProgressBar value={enrollment?.progress ?? 0} heightClass="h-1.5" />
      </div>
      <span className="w-10 text-right text-xs font-mono text-stone-500">{enrollment?.progress ?? 0}%</span>
    </div>
  );
}

export default function ClassDetailPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const cls = useSelector((state) => selectClassById(state, classId));
  const course = useSelector((state) => (cls ? selectCourseById(state, cls.courseId) : null));
  const users = useSelector(selectAllUsers);
  const assignments = useSelector((state) => selectAssignmentsByClass(state, classId));
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

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

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={cls.title} subtitle={course?.title} onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {course && <img src={course.thumbnailImage} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />}
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
            {canManage && (
              <button
                onClick={() => navigate(`/classes/${cls.id}/manage`)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
              >
                <Settings2 size={13} /> Manage materials
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-stone-800">
            <Users size={14} /> Students ({members.length})
          </h3>
          <div className="space-y-1.5">
            {members.map((m) => (
              <RosterRow key={m.id} member={m} courseId={cls.courseId} />
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
      </div>

      {showAssignmentForm && <AssignmentFormModal classId={cls.id} onClose={() => setShowAssignmentForm(false)} />}
    </div>
  );
}
