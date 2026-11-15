import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, BookOpen } from "lucide-react";
import { createClass, addCourseToClass } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectApprovedTrainers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";
import ModalOverlay from "./ModalOverlay";

// Sets up a new class from the Classes page. Only trainers can create
// classes in the API, and they're always its trainer.
export default function ClassFormModal({ onClose }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  // Courses still awaiting (or denied) approval are only offered here if
  // this user is the one who authored them — otherwise attaching someone
  // else's unreviewed course to a class would be a backdoor around review.
  const allCourses = useSelector(selectAllCourses);
  const courses = allCourses.filter((c) => c.status === "approved" || c.createdBy === currentUser.id);
  const trainers = useSelector(selectApprovedTrainers);
  const isTrainer = currentUser.role === "trainer";

  const [form, setForm] = useState({
    title: "",
    description: "",
    courses: [], // [{ courseId, mandatory }]
    trainerId: isTrainer ? currentUser.id : trainers[0]?.id ?? "",
    startDate: "",
    endDate: "",
  });

  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCourse = (courseId) => {
    setForm((prev) => {
      const exists = prev.courses.some((c) => c.courseId === courseId);
      return {
        ...prev,
        courses: exists ? prev.courses.filter((c) => c.courseId !== courseId) : [...prev.courses, { courseId, mandatory: false }],
      };
    });
  };

  const toggleMandatory = (courseId) => {
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.courseId === courseId ? { ...c, mandatory: !c.mandatory } : c)),
    }));
  };

  // Create the class, then attach each chosen course (the API takes them
  // one at a time).
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.courses.length === 0 || !form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) {
      dispatch(pushToast({ type: "error", message: "The end date must be on or after the start date." }));
      return;
    }
    setSaving(true);
    const created = await dispatch(createClass({ ...form, title: form.title.trim() }));
    if (created.error) {
      setSaving(false);
      dispatch(pushToast({ type: "error", message: created.payload || "Couldn't create the class." }));
      return;
    }
    const classId = created.payload.id;
    const failed = [];
    for (const entry of form.courses) {
      const attached = await dispatch(addCourseToClass({ classId, courseId: entry.courseId, mandatory: entry.mandatory }));
      if (attached.error) failed.push(entry.courseId);
    }
    setSaving(false);
    dispatch(
      pushToast(
        failed.length
          ? { type: "error", message: `"${form.title}" was created, but ${failed.length} course(s) couldn't be attached — add them from the class page.` }
          : { type: "success", message: `"${form.title}" class was created.` }
      )
    );
    onClose();
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
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
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Who this class is for, what it covers, and how sessions run"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-stone-600">
              <BookOpen size={12} /> Courses ({form.courses.length} selected)
            </label>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
              {courses.map((c) => {
                const entry = form.courses.find((fc) => fc.courseId === c.id);
                return (
                  <div key={c.id} className="rounded-lg px-2 py-1.5 hover:bg-stone-50">
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs">
                      <input type="checkbox" checked={!!entry} onChange={() => toggleCourse(c.id)} className="text-brand-700" />
                      <img src={c.thumbnailImage} alt="" className="h-6 w-9 shrink-0 rounded object-cover" />
                      <span className="flex-1 text-stone-700">{c.title}</span>
                      {c.status && c.status !== "approved" && (
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold capitalize text-amber-700">
                          {c.status}
                        </span>
                      )}
                    </label>
                    {entry && (
                      <label className="ml-8 mt-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-amber-700">
                        <input
                          type="checkbox"
                          checked={entry.mandatory}
                          onChange={() => toggleMandatory(c.id)}
                          className="text-amber-600"
                        />
                        Mandatory for this class
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Trainer</label>
            {isTrainer ? (
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {currentUser.avatarUrl && (
                  <img src={currentUser.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                )}
                {currentUser.name} <span className="text-xs text-stone-400">(you)</span>
              </div>
            ) : (
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
            )}
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

          <p className="text-[11px] text-stone-400">
            Students enroll themselves into this class from the Classes page once it's created —
            there's no roster to pick here.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {saving ? "Creating..." : "Create class"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
