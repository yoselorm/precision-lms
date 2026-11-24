import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, HelpCircle, Users, CalendarDays, Plus, Trash2, Loader2, Settings2, X } from "lucide-react";
import Header from "../components/Header";
import ClassRoster from "../components/ClassRoster";
import ThumbnailPicker from "../components/ThumbnailPicker";
import CourseTopicsManager from "../components/CourseTopicsManager";
import { selectClassById, selectClassesStatus, fetchClass, updateClass, addCourseToClass, removeCourseFromClass, setCourseMandatory } from "../store/slices/classesSlice";
import { selectAllCourses, selectCourseById, createCourse, fetchCourseContent } from "../store/slices/coursesSlice";
import { selectCategories } from "../store/slices/categoriesSlice";
import { useApiAction } from "../hooks/useApiAction";
import { selectCurrentUser } from "../store/slices/authSlice";
import ModalOverlay from "../components/ModalOverlay";
import { usePageData } from "../hooks/usePageData";
import { loadClasses } from "../store/loadAppData";

const fieldClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

// The class trainer edits its details, or moves it through
// upcoming → active → completed.
function EditClassModal({ cls, onClose }) {
  const [run, saving] = useApiAction();
  const [form, setForm] = useState({
    title: cls.title,
    description: cls.description,
    startDate: cls.startDate || "",
    endDate: cls.endDate || "",
    status: cls.status,
  });
  const [error, setError] = useState("");
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) {
      setError("The end date must be on or after the start date.");
      return;
    }
    const ok = await run(updateClass({ classId: cls.id, ...form, title: form.title.trim() }), { successMessage: "Class updated." });
    if (ok) onClose();
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Edit class</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Class title</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Start date</label>
              <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">End date</label>
              <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} required className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Status</label>
            <div className="flex gap-2">
              {["upcoming", "active", "completed"].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => update("status", status)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${
                    form.status === status ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// Attaches a course to the class (in addition to whatever's already there),
// with the per-class "mandatory" flag set at the same time.
function AddCourseModal({ classId, existingCourseIds, onClose }) {
  const [run, saving] = useApiAction();
  const currentUser = useSelector(selectCurrentUser);
  const allCourses = useSelector(selectAllCourses);
  const categories = useSelector(selectCategories);
  // Only offer courses that are either approved, or authored by this user —
  // attaching someone else's still-under-review course would bypass approval.
  const availableCourses = allCourses.filter(
    (c) => !existingCourseIds.includes(c.id) && (c.status === "approved" || c.createdBy === currentUser.id)
  );
  const [mode, setMode] = useState("existing");
  const [courseId, setCourseId] = useState(availableCourses[0]?.id ?? "");
  const [mandatory, setMandatory] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  // The API requires a category on every course.
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "existing") {
      if (!courseId) return;
      if (await run(addCourseToClass({ classId, courseId, mandatory }), { successMessage: "Course added to the class." })) onClose();
      return;
    }
    if (!newTitle.trim() || !categoryId) return;
    const created = await run(createCourse({ title: newTitle.trim(), categoryId, thumbnailImage }));
    if (!created) return;
    const attached = await run(addCourseToClass({ classId, courseId: created.id, mandatory }), {
      successMessage: `"${newTitle.trim()}" created as a draft and added to the class.`,
    });
    if (attached) onClose();
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Add a course to this class</h2>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${mode === "existing" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600"}`}
          >
            Use existing course
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${mode === "new" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600"}`}
          >
            Create new course
          </button>
        </div>

        {mode === "existing" ? (
          availableCourses.length === 0 ? (
            <p className="text-xs text-stone-400">Every course is already attached to this class.</p>
          ) : (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.status && c.status !== "approved" ? ` (${c.status})` : ""}
                </option>
              ))}
            </select>
          )
        ) : (
          <div className="space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New course title"
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
            {categories.length === 0 ? (
              <p className="text-xs text-rose-600">No categories yet — ask an admin to add some first.</p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <ThumbnailPicker value={thumbnailImage} onChange={setThumbnailImage} />
            <p className="text-[11px] text-stone-400">You'll add topics (video/text) to it right after creating it.</p>
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700">
          <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} className="text-amber-600" />
          Mandatory for this class
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (mode === "existing" ? availableCourses.length === 0 : !categoryId)}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add course
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// One attached course on this class: mandatory toggle plus its topics and
// lessons. Only the course's own trainer can see and edit its content here;
// admins see it read-only, and other trainers just see the course summary.
function ClassCourseCard({ cls, entry }) {
  const dispatch = useDispatch();
  const [run, busy] = useApiAction();
  const currentUser = useSelector(selectCurrentUser);
  const course = useSelector((state) => selectCourseById(state, entry.courseId));
  const isAdmin = currentUser.role === "admin";
  const showsContent = !!course && (isAdmin || course.createdBy === currentUser.id);

  useEffect(() => {
    if (showsContent) dispatch(fetchCourseContent(entry.courseId));
  }, [dispatch, entry.courseId, showsContent]);

  if (!course) return null;
  const topicCount = (course.revision?.topics ?? course.topics).length;

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <img src={course.thumbnailImage} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900">{course.title}</h3>
            {entry.mandatory && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">Mandatory</span>
            )}
          </div>
          {course.contentStatus === "succeeded" && (
            <p className="mt-0.5 text-xs text-stone-400">
              {topicCount} topic{topicCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {/* Attaching/detaching courses is the class trainer's job. */}
        {!isAdmin && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={entry.mandatory}
              disabled={busy}
              onChange={(e) => run(setCourseMandatory({ classId: cls.id, courseId: course.id, mandatory: e.target.checked }))}
              className="text-amber-600"
            />
            Mandatory
          </label>
          <button
            onClick={() => run(removeCourseFromClass({ classId: cls.id, courseId: course.id }))}
            disabled={busy}
            title="Remove this course from the class"
            className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={11} /> Remove
          </button>
        </div>
        )}
      </div>

      {currentUser.role === "admin" ? (
        <CourseTopicsManager course={course} readOnly />
      ) : course.createdBy === currentUser.id ? (
        course.status === "approved" ? (
          course.revision ? (
            <>
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] font-medium text-emerald-800">
                This course is live — changes here are saved as an update. Submit it for approval from the{" "}
                <Link to={`/trainer/courses/${course.id}/manage`} className="font-semibold underline">
                  course page
                </Link>
                .
              </p>
              <CourseTopicsManager course={course} useRevision />
            </>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] font-medium text-emerald-800">
              This course is live. To change its content, start an update from the{" "}
              <Link to={`/trainer/courses/${course.id}/manage`} className="font-semibold underline">
                course page
              </Link>
              .
            </p>
          )
        ) : (
          <CourseTopicsManager course={course} />
        )
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-xs text-stone-400">
          This course was created by another trainer, so its content isn't shown here.
        </p>
      )}
    </div>
  );
}

export default function ClassMaterialsPage({ onMenuClick }) {
  usePageData(loadClasses);
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const cls = useSelector((state) => selectClassById(state, classId));
  const classesStatus = useSelector(selectClassesStatus);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingClass, setEditingClass] = useState(false);

  // The detail response carries the class's courses and quiz.
  useEffect(() => {
    dispatch(fetchClass(classId));
  }, [dispatch, classId]);

  if (!cls && (classesStatus === "idle" || classesStatus === "loading")) {
    return (
      <div className="flex h-full flex-1 items-center justify-center gap-2 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" /> Loading class...
      </div>
    );
  }

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

  // A trainer may only manage their own classes; admins can manage any.
  if (currentUser.role === "trainer" && cls.trainerId !== currentUser.id) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-stone-400">
        You don't manage this class.{" "}
        <button className="ml-2 underline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";
  const classCourses = cls.courses || [];
  const existingCourseIds = classCourses.map((c) => c.courseId);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={cls.title} subtitle="Manage the courses and materials learners in this class will see." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Class</p>
              <h2 className="truncate text-base font-bold text-stone-900">{cls.title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {cls.memberCount} learner{cls.memberCount === 1 ? "" : "s"} · trainer {cls.trainerName ?? "—"}
                </span>
              </div>
            </div>
            {!isAdmin && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingClass(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Settings2 size={13} /> Edit class
                </button>
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                >
                  <Plus size={13} /> Add a course
                </button>
              </div>
            )}
          </div>
        </div>

        <ClassRoster cls={cls} showRoster />

        {!cls.courses ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-400">
            <Loader2 size={16} className="animate-spin" /> Loading courses...
          </div>
        ) : classCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            {isAdmin ? "No courses attached yet." : "No courses attached yet — add one above."}
          </div>
        ) : (
          classCourses.map((entry) => <ClassCourseCard key={entry.courseId} cls={cls} entry={entry} />)
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
              <HelpCircle size={15} /> Class quiz
            </h3>
            <p className="mt-0.5 text-xs text-stone-400">
              {cls.quiz?.questions?.length
                ? `${cls.quiz.title || "Quiz set"} · ${cls.quiz.questions.length} question${cls.quiz.questions.length > 1 ? "s" : ""}.`
                : "No quiz for this class yet."}{" "}
              Quizzes are created and edited on the Quizzes page.
            </p>
          </div>
          <button
            onClick={() => navigate("/quizzes")}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <HelpCircle size={13} /> Go to Quizzes
          </button>
        </div>
      </div>

      {editingClass && <EditClassModal cls={cls} onClose={() => setEditingClass(false)} />}
      {showAddCourse && (
        <AddCourseModal classId={cls.id} existingCourseIds={existingCourseIds} onClose={() => setShowAddCourse(false)} />
      )}
    </div>
  );
}
