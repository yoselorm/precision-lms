import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, HelpCircle, Users, CalendarDays, Plus, Trash2 } from "lucide-react";
import Header from "../components/Header";
import ThumbnailPicker from "../components/ThumbnailPicker";
import CourseTopicsManager from "../components/CourseTopicsManager";
import QuizManageModal from "../components/QuizManageModal";
import { selectClassById, addCourseToClass, removeCourseFromClass, setCourseMandatory, setClassQuiz } from "../store/slices/classesSlice";
import { selectAllCourses, selectCourseById, createBlankCourse } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";

// Attaches a course to the class (in addition to whatever's already there),
// with the per-class "mandatory" flag set at the same time.
function AddCourseModal({ classId, existingCourseIds, onClose }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const allCourses = useSelector(selectAllCourses);
  // Only offer courses that are either approved, or authored by this user —
  // attaching someone else's still-under-review course would bypass approval.
  const availableCourses = allCourses.filter(
    (c) => !existingCourseIds.includes(c.id) && ((c.status || "approved") === "approved" || c.createdBy === currentUser.id)
  );
  const [mode, setMode] = useState("existing");
  const [courseId, setCourseId] = useState(availableCourses[0]?.id ?? "");
  const [mandatory, setMandatory] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "existing") {
      if (!courseId) return;
      dispatch(addCourseToClass({ classId, courseId, mandatory }));
      dispatch(pushToast({ type: "success", message: "Course added to the class." }));
      onClose();
      return;
    }
    if (!newTitle.trim()) return;
    const action = dispatch(
      createBlankCourse({ title: newTitle, thumbnailImage, creatorId: currentUser.id, status: currentUser.role === "admin" ? "approved" : "pending" })
    );
    dispatch(addCourseToClass({ classId, courseId: action.payload.id, mandatory }));
    dispatch(pushToast({ type: "success", message: `"${newTitle}" created and added to the class.` }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
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
            disabled={mode === "existing" && availableCourses.length === 0}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add course
          </button>
        </div>
      </form>
    </div>
  );
}

// One attached course's full management surface: mandatory toggle plus its
// topics/lessons/quizzes (via CourseTopicsManager, same component the admin
// course-manage page uses) — independent of every other course on this class.
function ClassCourseCard({ cls, entry }) {
  const dispatch = useDispatch();
  const course = useSelector((state) => selectCourseById(state, entry.courseId));

  if (!course) return null;

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
          <p className="mt-0.5 text-xs text-stone-400">
            {course.topics.length} topic{course.topics.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={entry.mandatory}
              onChange={(e) => dispatch(setCourseMandatory({ classId: cls.id, courseId: course.id, mandatory: e.target.checked }))}
              className="text-amber-600"
            />
            Mandatory
          </label>
          <button
            onClick={() => dispatch(removeCourseFromClass({ classId: cls.id, courseId: course.id }))}
            title="Remove this course from the class"
            className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={11} /> Remove
          </button>
        </div>
      </div>

      <CourseTopicsManager course={course} />
    </div>
  );
}

export default function ClassMaterialsPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const cls = useSelector((state) => selectClassById(state, classId));
  const users = useSelector(selectAllUsers);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showClassQuiz, setShowClassQuiz] = useState(false);

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

  const trainer = users.find((u) => u.id === cls.trainerId);
  const members = users.filter((u) => cls.memberIds.includes(u.id));
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
                  <Users size={12} /> {members.length} learners · trainer {trainer?.name}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddCourse(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
            >
              <Plus size={13} /> Add a course
            </button>
          </div>
        </div>

        {classCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            No courses attached yet — add one above.
          </div>
        ) : (
          classCourses.map((entry) => <ClassCourseCard key={entry.courseId} cls={cls} entry={entry} />)
        )}

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                <HelpCircle size={15} /> Class quiz (this cohort only)
              </h3>
              <p className="mt-0.5 text-xs text-stone-400">
                {cls.quiz?.questions?.length
                  ? `${cls.quiz.questions.length} question${cls.quiz.questions.length > 1 ? "s" : ""}${
                      cls.quiz.timeLimitMins ? ` · ${cls.quiz.timeLimitMins} min limit` : ""
                    }`
                  : "No questions yet"}
              </p>
            </div>
            <button
              onClick={() => setShowClassQuiz(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <HelpCircle size={13} /> Manage quiz
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-400">
            A separate assessment just for students in this class — not tied to any single attached course, and
            taken from the class page rather than a course player.
          </p>
        </div>
      </div>

      {showAddCourse && (
        <AddCourseModal classId={cls.id} existingCourseIds={existingCourseIds} onClose={() => setShowAddCourse(false)} />
      )}
      {showClassQuiz && (
        <QuizManageModal
          title="Manage class quiz"
          subtitle={cls.title}
          quiz={cls.quiz}
          onSave={(payload) => {
            dispatch(setClassQuiz({ classId: cls.id, ...payload }));
            dispatch(pushToast({ type: "success", message: `Class quiz saved for "${cls.title}".` }));
          }}
          onClose={() => setShowClassQuiz(false)}
        />
      )}
    </div>
  );
}
