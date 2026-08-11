import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardCheck } from "lucide-react";
import Header from "../components/Header";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectLearners } from "../store/slices/usersSlice";
import { selectAllEnrollments, enrollUser } from "../store/slices/enrollmentsSlice";

export default function AdminEnroll({ onMenuClick }) {
  const dispatch = useDispatch();
  const courses = useSelector(selectAllCourses);
  const learners = useSelector(selectLearners);
  const enrollments = useSelector(selectAllEnrollments);

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const toggleUser = (id) => setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const alreadyEnrolled = (userId) => enrollments.some((e) => e.userId === userId && e.courseId === courseId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseId || selectedUserIds.length === 0) return;
    selectedUserIds.forEach((userId) => {
      if (!alreadyEnrolled(userId)) {
        dispatch(enrollUser({ userId, courseId, dueDate: dueDate || undefined }));
      }
    });
    setConfirmation(`Enrolled ${selectedUserIds.length} learner(s) into ${courses.find((c) => c.id === courseId)?.title}.`);
    setSelectedUserIds([]);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Enroll users" subtitle="Assign a course to one or more learners." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
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
                    <span className="ml-auto text-[10px] text-stone-400">{enrolled ? "Already enrolled" : u.department}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={selectedUserIds.length === 0}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enroll selected learners
          </button>
        </form>
      </div>
    </div>
  );
}
