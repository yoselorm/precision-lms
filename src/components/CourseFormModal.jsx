import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { X, Tag, Gift, Film } from "lucide-react";
import ThumbnailPicker from "./ThumbnailPicker";
import FileOrUrlInput from "./FileOrUrlInput";
import RichTextEditor from "./RichTextEditor";
import { addCourse } from "../store/slices/coursesSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectApprovedTrainers } from "../store/slices/usersSlice";
import { selectCategories } from "../store/slices/categoriesSlice";
import { pushToast } from "../store/slices/uiSlice";
import { htmlToText } from "../utils/richText";
import ModalOverlay from "./ModalOverlay";

const inputClass = "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand-600";
const borderFor = (error) => (error ? "border-rose-400" : "border-stone-200");

function Label({ children, required, optional }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-stone-700">
      {children}
      {required && <span className="text-rose-500">*</span>}
      {optional && <span className="text-xs font-normal text-stone-400">(optional)</span>}
    </label>
  );
}

const FieldError = ({ children }) => (children ? <p className="mt-1 text-xs font-medium text-rose-600">{children}</p> : null);

// Shell-only "Add course" form shared by admins and trainers. Every course
// starts as a draft owned by a trainer, who builds its content and submits
// it for approval — when an admin creates one, they assign it to a trainer.
export default function CourseFormModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isTrainer = currentUser.role === "trainer";
  const trainers = useSelector(selectApprovedTrainers);
  const categories = useSelector(selectCategories);
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "");
  const [form, setForm] = useState({
    title: "",
    category: "",
    pricing: "free",
    price: "",
    description: "",
    thumbnailImage: "",
    demoVideoUrl: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Give the course a title.";
    if (!form.category) next.category = "Choose a category.";
    if (!htmlToText(form.description)) next.description = "Describe what learners will get out of this course.";
    if (form.pricing === "paid" && !(Number(form.price) > 0)) next.price = "A paid course needs a price above 0.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const ownerId = isTrainer ? currentUser.id : trainerId || null;
    const action = dispatch(
      addCourse({
        title: form.title.trim(),
        category: form.category,
        description: form.description,
        thumbnailImage: form.thumbnailImage,
        demoVideoUrl: form.demoVideoUrl,
        price: form.pricing === "paid" ? Number(form.price) : 0,
        creatorId: ownerId,
        status: "draft",
      })
    );
    const owner = trainers.find((t) => t.id === ownerId);
    dispatch(
      pushToast({
        type: "success",
        message: isTrainer
          ? `Draft "${form.title}" created — add its topics and lessons, then submit it for approval.`
          : owner
          ? `"${form.title}" was created and assigned to ${owner.name} to build.`
          : `"${form.title}" was created. Assign a trainer from the course list when you're ready.`,
      })
    );
    onClose();
    onCreated?.(action.payload.id);
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} noValidate className="max-h-[92vh] w-full max-w-3xl animate-scale-in overflow-y-auto rounded-2xl bg-white p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Add a new course</h2>
            <p className="mt-0.5 text-xs text-stone-400">
              Fields marked <span className="text-rose-500">*</span> are required.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        {isTrainer ? (
          <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            Your course starts as a draft. Add its topics and lessons, then submit it for admin approval before learners can see it in
            the catalog.
          </p>
        ) : (
          <p className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-xs font-medium text-brand-800">
            The trainer you assign builds the course content and submits it back to you for approval. You can also assign a trainer
            later from the course list.
          </p>
        )}

        <div className="space-y-5">
          {!isTrainer && (
            <div>
              <Label optional>Assign to trainer</Label>
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={`${inputClass} ${borderFor(false)}`}>
                <option value="">Don't assign a trainer yet</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {trainers.length === 0 && <p className="mt-1 text-xs text-stone-400">There are no approved trainers yet — you can assign one later.</p>}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-[1fr_240px]">
            <div>
              <Label required>Course title</Label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Outbreak Investigation Fundamentals"
                className={`${inputClass} ${borderFor(errors.title)}`}
              />
              <FieldError>{errors.title}</FieldError>
            </div>
            <div>
              <Label required>Category</Label>
              {categories.length === 0 ? (
                <p className="text-xs text-rose-600">
                  No categories yet.{" "}
                  {isTrainer ? "Ask an admin to add some." : <Link to="/admin/categories" className="font-semibold underline" onClick={onClose}>Add categories</Link>}
                </p>
              ) : (
                <select value={form.category} onChange={(e) => update("category", e.target.value)} className={`${inputClass} ${borderFor(errors.category)}`}>
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <FieldError>{errors.category}</FieldError>
            </div>
          </div>

          <div>
            <Label required>Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => update("description", v)}
              placeholder="What will learners get out of this course? Who is it for?"
              invalid={!!errors.description}
            />
            <FieldError>{errors.description}</FieldError>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <ThumbnailPicker value={form.thumbnailImage} onChange={(v) => update("thumbnailImage", v)} />
            </div>
            <div>
              <Label optional>
                <Film size={14} className="text-stone-400" /> Demo video
              </Label>
              <p className="mb-2 text-xs text-stone-400">A short preview learners can watch before they enroll.</p>
              <FileOrUrlInput value={form.demoVideoUrl} onChange={(v) => update("demoVideoUrl", v)} accept="video/*" kind="video" label={null} />
            </div>
          </div>

          <div>
            <Label required>Pricing</Label>
            <div className="grid max-w-md grid-cols-2 gap-2">
              {[
                ["free", "Free", Gift],
                ["paid", "Paid", Tag],
              ].map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("pricing", value)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    form.pricing === value ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            {form.pricing === "paid" && (
              <div className="mt-3 max-w-xs animate-fade-in">
                <Label required>Price (GH₵)</Label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="e.g. 250"
                  className={`${inputClass} ${borderFor(errors.price)}`}
                />
                <FieldError>{errors.price}</FieldError>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-400">Topics and lessons are added from the course's page after this.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              Create course
            </button>
          </div>
        </div>
      </form>
    </ModalOverlay>
  );
}
