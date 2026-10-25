import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, CalendarDays, FileCheck2, Lock, LockOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "../components/Header";
import SubmissionUpload from "../components/SubmissionUpload";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllClasses } from "../store/slices/classesSlice";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import {
  selectAllAssignments,
  addAssignment,
  updateAssignment,
  setAssignmentStatus,
  removeAssignment,
  isAssignmentClosed,
} from "../store/slices/assignmentsSlice";
import { selectAllSubmissions } from "../store/slices/submissionsSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";
import ModalOverlay from "../components/ModalOverlay";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

const TYPE_META = {
  course: { label: "Course", icon: BookOpen, pill: "border-brand-200 bg-brand-50 text-brand-700" },
  class: { label: "Class", icon: CalendarDays, pill: "border-violet-200 bg-violet-50 text-violet-700" },
};

const formatDue = (date) =>
  date ? `Due ${new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "No due date";

// Resolves what each assignment belongs to, dropping any whose course or
// class no longer exists.
function describeAssignments(assignments, courses, classes) {
  return assignments
    .map((a) => {
      if (a.courseId) {
        const course = courses.find((c) => c.id === a.courseId);
        return course && { assignment: a, type: "course", belongsTo: course.title };
      }
      const cls = classes.find((c) => c.id === a.classId);
      return cls && { assignment: a, type: "class", belongsTo: cls.title };
    })
    .filter(Boolean);
}

function TypePill({ type }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={`flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.pill}`}>
      <Icon size={10} /> {meta.label}
    </span>
  );
}

function StatusPill({ closed }) {
  return (
    <span
      className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        closed ? "border-stone-200 bg-stone-100 text-stone-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {closed ? "Closed" : "Open"}
    </span>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            value === t.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Create or edit an assignment. When creating, the author first picks what
// it belongs to — a course or a particular class. When editing, that's fixed.
function AssignmentFormModal({ courses, classes, editing, onClose }) {
  const dispatch = useDispatch();
  const [type, setType] = useState(editing?.type || "course");
  const [courseId, setCourseId] = useState(editing?.assignment.courseId || courses[0]?.id || "");
  const [classId, setClassId] = useState(editing?.assignment.classId || classes[0]?.id || "");
  const [title, setTitle] = useState(editing?.assignment.title || "");
  const [instructions, setInstructions] = useState(editing?.assignment.instructions || "");
  const [dueDate, setDueDate] = useState(editing?.assignment.dueDate || "");
  const [autoCloseOnDueDate, setAutoCloseOnDueDate] = useState(editing?.assignment.autoCloseOnDueDate || false);

  const targetChosen = type === "course" ? !!courseId : !!classId;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !targetChosen) return;
    const fields = { title: title.trim(), instructions, dueDate, autoCloseOnDueDate: autoCloseOnDueDate && !!dueDate };
    if (editing) {
      dispatch(updateAssignment({ id: editing.assignment.id, ...fields }));
    } else {
      dispatch(addAssignment({ ...fields, ...(type === "course" ? { courseId } : { classId }) }));
    }
    dispatch(pushToast({ type: "success", message: editing ? "Assignment updated." : `Assignment "${fields.title}" created.` }));
    onClose();
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">{editing ? "Edit assignment" : "Create an assignment"}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">This assignment belongs to</label>
            {editing ? (
              <div className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <TypePill type={editing.type} />
                <span className="truncate font-medium">{editing.belongsTo}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {["course", "class"].map((t) => {
                  const Icon = TYPE_META[t].icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                        type === t ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <Icon size={14} /> A {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!editing &&
            (type === "course" ? (
              courses.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-300 p-3 text-xs text-stone-400">You don't have any courses yet.</p>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">Course</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-stone-400">Every learner enrolled in this course will get it.</p>
                </div>
              )
            ) : classes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 p-3 text-xs text-stone-400">You don't have any classes yet.</p>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-stone-400">Only learners in this class will get it.</p>
              </div>
            ))}

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Outbreak investigation report" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="What should learners submit, and in what format?"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Due date (optional)</label>
            <input type="date" value={dueDate || ""} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </div>
          <label className={`flex items-center gap-2 text-xs font-semibold ${dueDate ? "text-stone-600" : "text-stone-300"}`}>
            <input
              type="checkbox"
              checked={autoCloseOnDueDate && !!dueDate}
              disabled={!dueDate}
              onChange={(e) => setAutoCloseOnDueDate(e.target.checked)}
            />
            Close submissions automatically after the due date
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!targetChosen}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? "Save changes" : "Create assignment"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function SubmissionsModal({ row, submissions, users, onClose }) {
  return (
    <ModalOverlay>
      <div className="max-h-[80vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-stone-900">{row.assignment.title}</h2>
            <p className="text-xs text-stone-400">{submissions.length} submission{submissions.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        {submissions.length === 0 ? (
          <p className="text-sm text-stone-400">No submissions yet.</p>
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
                  className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs hover:bg-stone-100"
                >
                  <img src={student?.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-700">{student?.name ?? "Unknown learner"}</p>
                    <p className="truncate text-[10px] text-stone-400">{s.fileName}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-stone-400">{new Date(s.submittedAt).toLocaleDateString()}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// Trainers set and manage assignments on the courses they authored and the
// classes they run. Admins see every assignment and its submissions, but
// only view them — setting assignments is the trainers' job.
function AssignmentManager({ currentUser }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const allCourses = useSelector(selectAllCourses);
  const allClasses = useSelector(selectAllClasses);
  const assignments = useSelector(selectAllAssignments);
  const submissions = useSelector(selectAllSubmissions);
  const users = useSelector(selectAllUsers);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState(null); // { editing: row | null }
  const [viewing, setViewing] = useState(null);

  const isAdmin = currentUser.role === "admin";
  const classes = isAdmin ? allClasses : allClasses.filter((c) => c.trainerId === currentUser.id);
  const courses = useMemo(
    () => (isAdmin ? allCourses : allCourses.filter((c) => c.createdBy === currentUser.id)),
    [isAdmin, allCourses, currentUser.id]
  );

  const rows = describeAssignments(assignments, courses, classes);
  const visible = filter === "all" ? rows : rows.filter((r) => r.type === filter);
  const submissionsFor = (row) => submissions.filter((s) => s.type === "assignment" && s.refId === row.assignment.id);

  const toggleClosed = (row) => {
    const closed = isAssignmentClosed(row.assignment);
    dispatch(setAssignmentStatus({ id: row.assignment.id, status: closed ? "open" : "closed" }));
    dispatch(pushToast({ type: closed ? "success" : "info", message: `Submissions ${closed ? "reopened" : "closed"} for "${row.assignment.title}".` }));
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: `Delete "${row.assignment.title}"?`,
      message: "Learners will no longer see it, and its submissions will no longer be listed.",
      confirmLabel: "Delete assignment",
      tone: "danger",
    });
    if (!ok) return;
    dispatch(removeAssignment({ id: row.assignment.id }));
    dispatch(pushToast({ type: "success", message: "Assignment deleted." }));
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: `All (${rows.length})` },
            { id: "course", label: "Course assignments" },
            { id: "class", label: "Class assignments" },
          ]}
        />
        {!isAdmin && (
          <button
            onClick={() => setEditor({ editing: null })}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Create assignment
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
          {isAdmin ? "No assignments here yet." : "No assignments here yet. Create one and choose whether it belongs to a course or a class."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Belongs to</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((row) => {
                const closed = isAssignmentClosed(row.assignment);
                const count = submissionsFor(row).length;
                return (
                  <tr key={row.assignment.id}>
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-semibold text-stone-800">{row.assignment.title}</p>
                      {row.assignment.instructions && <p className="truncate text-[10px] text-stone-400">{row.assignment.instructions}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <TypePill type={row.type} />
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-700">{row.belongsTo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                      {row.assignment.dueDate ? new Date(row.assignment.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill closed={closed} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewing(row)} className="flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                        <FileCheck2 size={12} /> {count}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {!isAdmin && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditor({ editing: row })}
                            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => toggleClosed(row)}
                            title={closed ? "Reopen submissions" : "Close submissions"}
                            className="rounded-lg border border-stone-200 px-2 py-1.5 text-stone-500 hover:bg-stone-50"
                          >
                            {closed ? <LockOpen size={12} /> : <Lock size={12} />}
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            title="Delete assignment"
                            className="rounded-lg border border-stone-200 px-2 py-1.5 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editor && <AssignmentFormModal courses={courses} classes={classes} editing={editor.editing} onClose={() => setEditor(null)} />}
      {viewing && <SubmissionsModal row={viewing} submissions={submissionsFor(viewing)} users={users} onClose={() => setViewing(null)} />}
    </div>
  );
}

// Learners see assignments from the courses they're enrolled in and the
// classes they belong to, and submit their work right here.
function LearnerAssignments({ currentUser }) {
  const allCourses = useSelector(selectAllCourses);
  const allClasses = useSelector(selectAllClasses);
  const assignments = useSelector(selectAllAssignments);
  const enrollments = useSelector(selectAllEnrollments);
  const submissions = useSelector(selectAllSubmissions);
  const [filter, setFilter] = useState("todo");

  const enrolledIds = new Set(enrollments.filter((e) => e.userId === currentUser.id).map((e) => e.courseId));
  const courses = allCourses.filter((c) => enrolledIds.has(c.id));
  const classes = allClasses.filter((c) => c.memberIds.includes(currentUser.id));

  const rows = describeAssignments(assignments, courses, classes).map((row) => ({
    ...row,
    submitted: submissions.some((s) => s.type === "assignment" && s.refId === row.assignment.id && s.userId === currentUser.id),
  }));
  const visible = filter === "todo" ? rows.filter((r) => !r.submitted) : filter === "submitted" ? rows.filter((r) => r.submitted) : rows;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "todo", label: `To submit (${rows.filter((r) => !r.submitted).length})` },
          { id: "submitted", label: "Submitted" },
          { id: "all", label: "All" },
        ]}
      />

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
          {rows.length === 0
            ? "No assignments yet. Enroll in a course or join a class to see its assignments here."
            : filter === "todo"
            ? "You're all caught up."
            : "Nothing in this list."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((row) => {
            const closed = isAssignmentClosed(row.assignment);
            return (
              <div key={row.assignment.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <TypePill type={row.type} />
                  <StatusPill closed={closed} />
                  <span className="ml-auto text-[10px] font-semibold text-stone-400">{formatDue(row.assignment.dueDate)}</span>
                </div>
                <h3 className="text-sm font-bold leading-snug text-stone-900">{row.assignment.title}</h3>
                <p className="mt-0.5 text-xs text-stone-500">{row.belongsTo}</p>
                {row.assignment.instructions && (
                  <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-stone-600">{row.assignment.instructions}</p>
                )}
                <div className="mt-4">
                  <SubmissionUpload type="assignment" refId={row.assignment.id} userId={currentUser.id} disabled={closed} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AssignmentsPage({ onMenuClick }) {
  const currentUser = useSelector(selectCurrentUser);
  const isLearner = currentUser.role === "learner";

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title={isLearner ? "My Assignments" : "Assignments"}
        subtitle={
          isLearner
            ? "Assignments from your courses and classes — submit your work here."
            : currentUser.role === "admin"
            ? "Every assignment across all courses and classes, with learner submissions. Trainers set them."
            : "Set assignments for your courses or classes, and review what learners submit."
        }
        onMenuClick={onMenuClick}
      />
      {isLearner ? <LearnerAssignments currentUser={currentUser} /> : <AssignmentManager currentUser={currentUser} />}
    </div>
  );
}
