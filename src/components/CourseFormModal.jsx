import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Tag, Award, Trophy } from "lucide-react";
import ThumbnailPicker from "./ThumbnailPicker";
import { addCourse } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";

const CATEGORIES = ["Compliance", "Leadership", "Onboarding", "Technical Skills", "Sales", "Marketing"];

// Shell-only "Add course" form shared by admins and trainers. Admin-authored
// courses publish immediately; trainer-authored ones are submitted for
// review and stay out of the public catalog until an admin approves them.
export default function CourseFormModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isTrainer = currentUser.role === "trainer";
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    mandatory: false,
    durationMins: 45,
    price: 0,
    description: "",
    certificateTitle: "",
    thumbnailImage: "",
    capstoneTitle: "",
    capstoneInstructions: "",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const action = dispatch(
      addCourse({ ...form, creatorId: currentUser.id, status: isTrainer ? "pending" : "approved" })
    );
    dispatch(
      pushToast({
        type: "success",
        message: isTrainer
          ? `"${form.title}" was submitted for admin approval — add topics from its manage page while you wait.`
          : `"${form.title}" was created — add topics from its manage page.`,
      })
    );
    onClose();
    onCreated?.(action.payload.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Add a new course</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        {isTrainer && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
            New courses you create need admin approval before learners can see them in the catalog. You can keep
            building it (topics, lessons, quizzes) while it's pending.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Course title</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              placeholder="e.g. Advanced Negotiation Skills"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <ThumbnailPicker value={form.thumbnailImage} onChange={(v) => update("thumbnailImage", v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Total duration (mins)</label>
              <input
                type="number"
                min="5"
                value={form.durationMins}
                onChange={(e) => update("durationMins", e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              placeholder="What will learners get out of this course?"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-stone-600">
                <Tag size={12} /> Price (GH₵, 0 = free)
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
            </div>
            <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-stone-600">
              <input type="checkbox" checked={form.mandatory} onChange={(e) => update("mandatory", e.target.checked)} className="text-brand-700" />
              Mandatory course
            </label>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-stone-600">
              <Award size={12} /> Certificate title (leave blank for no certificate)
            </label>
            <input
              value={form.certificateTitle}
              onChange={(e) => update("certificateTitle", e.target.value)}
              placeholder="e.g. Certificate of Completion — Advanced Negotiation"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
              <Trophy size={12} /> Capstone project (optional)
            </label>
            <input
              value={form.capstoneTitle}
              onChange={(e) => update("capstoneTitle", e.target.value)}
              placeholder="e.g. Final Case Study Submission"
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
            {form.capstoneTitle && (
              <textarea
                value={form.capstoneInstructions}
                onChange={(e) => update("capstoneInstructions", e.target.value)}
                rows={2}
                placeholder="What should students submit, and what should it cover?"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-brand-600"
              />
            )}
            <p className="mt-1 text-[10px] text-amber-700">
              Students will submit a PDF or Word doc for this from the course player.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Create course
          </button>
        </div>
        <p className="mt-3 text-[11px] text-stone-400">
          You'll add topics, lessons, and quizzes from the course's manage page right after this.
        </p>
      </form>
    </div>
  );
}
