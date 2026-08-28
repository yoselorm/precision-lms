import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, PlayCircle, FileText, HelpCircle, Users, CalendarDays, Repeat, Plus } from "lucide-react";
import Header from "../components/Header";
import ThumbnailPicker from "../components/ThumbnailPicker";
import TopicListEditor from "../components/TopicListEditor";
import QuizManageModal from "../components/QuizManageModal";
import { selectClassById, setClassCourse, setClassQuiz } from "../store/slices/classesSlice";
import { selectAllCourses, selectCourseById, addModuleToCourse, createBlankCourse, setCourseQuiz } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";

const MODULE_ICONS = { video: PlayCircle, reading: FileText, quiz: HelpCircle };

function SwapCourseModal({ classId, currentCourseId, onClose }) {
  const dispatch = useDispatch();
  const courses = useSelector(selectAllCourses);
  const [mode, setMode] = useState("existing");
  const [courseId, setCourseId] = useState(currentCourseId);
  const [newTitle, setNewTitle] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "existing") {
      dispatch(setClassCourse({ classId, courseId }));
      onClose();
      return;
    }
    if (!newTitle.trim()) return;
    const action = dispatch(createBlankCourse({ title: newTitle, thumbnailImage }));
    dispatch(setClassCourse({ classId, courseId: action.payload.id }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Attach a course to this class</h2>

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
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
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

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ClassMaterialsPage({ onMenuClick }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const cls = useSelector((state) => selectClassById(state, classId));
  const course = useSelector((state) => (cls ? selectCourseById(state, cls.courseId) : null));
  const users = useSelector(selectAllUsers);
  const [showSwap, setShowSwap] = useState(false);
  const [showCourseQuiz, setShowCourseQuiz] = useState(false);
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

  const handleAddTopics = (topics) => {
    const newTopics = topics.filter((t) => !course.modules.some((m) => m.title === t.title));
    newTopics.forEach((t) => dispatch(addModuleToCourse({ courseId: course.id, ...t })));
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={cls.title} subtitle="Manage the course material learners in this class will see." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {course && <img src={course.thumbnailImage} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Attached course</p>
              <h2 className="truncate text-base font-bold text-stone-900">{course?.title ?? "No course attached"}</h2>
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
              onClick={() => setShowSwap(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Repeat size={13} /> Swap course
            </button>
          </div>
        </div>

        {course ? (
          <>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold text-stone-800">Current topics ({course.modules.length})</h3>
              {course.modules.length === 0 ? (
                <p className="text-xs text-stone-400">No topics yet — add the first one below.</p>
              ) : (
                <div className="space-y-1.5">
                  {course.modules.map((m) => {
                    const Icon = MODULE_ICONS[m.type] || FileText;
                    return (
                      <div key={m.id} className="flex items-center gap-2.5 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs">
                        <Icon size={13} className="shrink-0 text-stone-400" />
                        <span className="flex-1 font-medium text-stone-700">{m.title}</span>
                        <span className="text-[10px] text-stone-400">{m.durationMins}m</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-stone-800">
                <Plus size={15} /> Add materials for learners
              </h3>
              <TopicListEditor topics={[]} onChange={handleAddTopics} />
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                    <HelpCircle size={15} /> Course quiz (shared)
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {course.quiz?.questions?.length
                      ? `${course.quiz.questions.length} question${course.quiz.questions.length > 1 ? "s" : ""}${
                          course.quiz.timeLimitMins ? ` · ${course.quiz.timeLimitMins} min limit` : ""
                        }`
                      : "No questions yet"}
                  </p>
                </div>
                <button
                  onClick={() => setShowCourseQuiz(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <HelpCircle size={13} /> Manage quiz
                </button>
              </div>
              <p className="mt-2 text-[11px] text-stone-400">
                Lives on the course itself and is taken from inside the course player — editing it here updates it
                for any other class built on the same course too.
              </p>
            </div>

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
                A separate assessment just for students in this class — taken from the class page, not the course
                player. Other classes on the same course aren't affected.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            Attach a course above before adding materials.
          </div>
        )}
      </div>

      {showSwap && <SwapCourseModal classId={cls.id} currentCourseId={cls.courseId} onClose={() => setShowSwap(false)} />}
      {showCourseQuiz && course && (
        <QuizManageModal
          title="Manage course quiz"
          subtitle={course.title}
          quiz={course.quiz}
          onSave={(payload) => {
            dispatch(setCourseQuiz({ courseId: course.id, ...payload }));
            dispatch(pushToast({ type: "success", message: `Course quiz saved for "${course.title}".` }));
          }}
          onClose={() => setShowCourseQuiz(false)}
        />
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
