import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Tag } from "lucide-react";
import ThumbnailPicker from "./ThumbnailPicker";
import { addCourse } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectApprovedTrainers } from "../store/slices/usersSlice";
import { pushToast } from "../store/slices/uiSlice";
import ModalOverlay from "./ModalOverlay";

const CATEGORIES = ["Compliance", "Leadership", "Onboarding", "Technical Skills", "Sales", "Marketing"];

// Shell-only "Add course" form shared by admins and trainers. Every course
// starts as a draft owned by a trainer, who builds its content and submits
// it for approval — when an admin creates one, they assign it to a trainer.
export default function CourseFormModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isTrainer = currentUser.role === "trainer";
  const trainers = useSelector(selectApprovedTrainers);
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "");
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    mandatory: false,
    durationMins: 45,
    price: 0,
    description: "",
    thumbnailImage: "",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || (!isTrainer && !trainerId)) return;
    const ownerId = isTrainer ? currentUser.id : trainerId;
    const action = dispatch(addCourse({ ...form, creatorId: ownerId, status: "draft" }));
    const owner = trainers.find((t) => t.id === ownerId);
    dispatch(
      pushToast({
        type: "success",
        message: isTrainer
          ? `Draft "${form.title}" created — add its topics and lessons, then submit it for approval.`
          : `"${form.title}" was created and assigned to ${owner?.name ?? "the trainer"} to build.`,
      })
    );
    onClose();
    onCreated?.(action.payload.id);
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Add a new course</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        {isTrainer ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
            Your course starts as a draft. Add its topics and lessons, then submit it for admin approval before
            learners can see it in the catalog.
          </p>
        ) : (
          <p className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] font-medium text-brand-800">
            The trainer you assign builds the course content and submits it back to you for approval.
          </p>
        )}

        <div className="space-y-4">
          {!isTrainer && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Assign to trainer</label>
              {trainers.length === 0 ? (
                <p className="text-xs text-rose-600">There are no approved trainers yet — approve or add one under Users first.</p>
              ) : (
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
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
          Topics and lessons are added from the course's page; quizzes and assignments from the Quizzes and Assignments pages.
        </p>
      </form>
    </ModalOverlay>
  );
}
