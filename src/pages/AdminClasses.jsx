import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, X, CalendarDays, GraduationCap, Users, Settings2 } from "lucide-react";
import Header from "../components/Header";
import { selectAllClasses, addClass } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllUsers, selectApprovedTrainers, selectLearners } from "../store/slices/usersSlice";

function ClassFormModal({ onClose }) {
  const dispatch = useDispatch();
  const courses = useSelector(selectAllCourses);
  const trainers = useSelector(selectApprovedTrainers);
  const learners = useSelector(selectLearners);

  const [form, setForm] = useState({
    title: "",
    courseId: courses[0]?.id ?? "",
    trainerId: trainers[0]?.id ?? "",
    memberIds: [],
    startDate: "",
    endDate: "",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId) ? prev.memberIds.filter((id) => id !== userId) : [...prev.memberIds, userId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId || !form.trainerId || !form.startDate || !form.endDate) return;
    dispatch(addClass(form));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Set up a new class</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Class title</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              placeholder="e.g. Leadership Cohort — Sept 2026"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Course</label>
            <select
              value={form.courseId}
              onChange={(e) => update("courseId", e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Trainer</label>
            <select
              value={form.trainerId}
              onChange={(e) => update("trainerId", e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              {trainers.length === 0 && <option value="">No trainers available — add one under Users</option>}
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                required
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                required
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">Students ({form.memberIds.length} selected)</label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
              {learners.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs hover:bg-stone-50">
                  <input type="checkbox" checked={form.memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} className="text-brand-700" />
                  <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-stone-700">{u.name}</span>
                  <span className="ml-auto text-[10px] text-stone-400">{u.department}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Create class
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminClasses({ onMenuClick }) {
  const navigate = useNavigate();
  const classes = useSelector(selectAllClasses);
  const courses = useSelector(selectAllCourses);
  const users = useSelector(selectAllUsers);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Classes" subtitle={`${classes.length} scheduled cohorts`} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Add class
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const course = courses.find((c) => c.id === cls.courseId);
            const trainer = users.find((u) => u.id === cls.trainerId);
            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/classes/${cls.id}`)}
                className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-stone-900">{cls.title}</h3>
                <p className="mt-0.5 text-xs text-stone-500">{course?.title}</p>
                <div className="mt-3 space-y-1.5 text-xs text-stone-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={12} /> {trainer?.name ?? "Unassigned"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={12} /> {cls.memberIds.length} students
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/classes/${cls.id}/manage`);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Settings2 size={13} /> Manage materials
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && <ClassFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
