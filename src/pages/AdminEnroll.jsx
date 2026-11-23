import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import Header from "../components/Header";
import { selectPublicCourses } from "../store/slices/coursesSlice";
import { selectLearners } from "../store/slices/usersSlice";
import { adminEnrollUsers } from "../store/slices/enrollmentsSlice";
import { useApiAction } from "../hooks/useApiAction";
import { usePageData } from "../hooks/usePageData";
import { loadEnrollPage } from "../store/loadAppData";

// Admins enroll learners into an approved course, optionally with a due
// date. The server can't list other people's enrollments, so "already
// enrolled" only knows about enrollments made here this session — enrolling
// someone twice is harmless (the server returns the existing enrollment).
export default function AdminEnroll({ onMenuClick }) {
  usePageData(loadEnrollPage);
  const courses = useSelector(selectPublicCourses);
  const learners = useSelector(selectLearners);
  const enrolledHere = useSelector((state) => state.enrollments.adminEnrolled);
  const [run, busy] = useApiAction();

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  // Courses load after the first render.
  useEffect(() => {
    if (!courseId && courses[0]) setCourseId(courses[0].id);
  }, [courseId, courses]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [failures, setFailures] = useState([]);

  const toggleUser = (id) => setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const alreadyEnrolled = (userId) => enrolledHere.some((e) => e.userId === userId && e.courseId === courseId);
  const nameOf = (userId) => learners.find((u) => u.id === userId)?.name || "A learner";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId || selectedUserIds.length === 0) return;
    setConfirmation(null);
    setFailures([]);
    const result = await run(adminEnrollUsers({ userIds: selectedUserIds, courseId, dueDate }));
    if (!result) return;
    const title = courses.find((c) => c.id === courseId)?.title;
    if (result.enrolled.length) {
      setConfirmation(`Enrolled ${result.enrolled.length} learner${result.enrolled.length > 1 ? "s" : ""} into "${title}"${dueDate ? `, due ${dueDate}` : ""}.`);
    }
    setFailures(result.failed.map((f) => `${nameOf(f.userId)}: ${f.message}`));
    setSelectedUserIds(result.failed.map((f) => f.userId));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Enroll users" subtitle="Assign a course to one or more learners." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        {failures.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Some learners couldn't be enrolled (still selected, so you can retry):</p>
              <ul className="mt-1 list-disc pl-4">
                {failures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {confirmation && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <ClipboardCheck size={15} /> {confirmation}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.price > 0 ? `(GH₵${c.price})` : "(Free)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">
              Learners ({selectedUserIds.length} selected)
            </label>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
              {learners.map((u) => {
                const enrolled = alreadyEnrolled(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs ${
                      enrolled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={enrolled}
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="text-brand-700"
                    />
                    <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                    <span className="text-stone-700">{u.name}</span>
                    <span className="ml-auto text-[10px] text-stone-400">{enrolled ? "Enrolled" : u.department}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !courseId || selectedUserIds.length === 0}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Enrolling..." : selectedUserIds.length > 1 ? `Enroll ${selectedUserIds.length} learners` : "Enroll selected learner"}
          </button>
        </form>
      </div>
    </div>
  );
}
