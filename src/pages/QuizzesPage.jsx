import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, CalendarDays, CheckCircle2, Clock, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "../components/Header";
import QuizBuilder from "../components/QuizBuilder";
import QuizPreview from "../components/QuizPreview";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses, setTopicQuiz, removeTopicQuiz, editableTopicsOf } from "../store/slices/coursesSlice";
import { selectAllClasses, setClassQuiz, removeClassQuiz } from "../store/slices/classesSlice";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";
import ModalOverlay from "../components/ModalOverlay";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

const TYPE_META = {
  course: { label: "Course", icon: BookOpen, pill: "border-brand-200 bg-brand-50 text-brand-700" },
  class: { label: "Class", icon: CalendarDays, pill: "border-violet-200 bg-violet-50 text-violet-700" },
};

const hasQuestions = (quiz) => (quiz?.questions?.length ?? 0) > 0;

// Flattens every quiz in the system into one list. Course quizzes live on a
// course's topics; class quizzes live on the class itself.
function collectQuizzes(courses, classes) {
  const rows = [];
  courses.forEach((course) => {
    course.topics.forEach((topic) => {
      if (!hasQuestions(topic.quiz)) return;
      rows.push({
        key: `course:${course.id}:${topic.id}`,
        type: "course",
        quiz: topic.quiz,
        title: topic.quiz.title || `${topic.title} quiz`,
        belongsTo: course.title,
        detail: topic.title,
        course,
        topic,
      });
    });
  });
  classes.forEach((cls) => {
    if (!hasQuestions(cls.quiz)) return;
    rows.push({
      key: `class:${cls.id}`,
      type: "class",
      quiz: cls.quiz,
      title: cls.quiz.title || `${cls.title} quiz`,
      belongsTo: cls.title,
      detail: "Class members only",
      cls,
    });
  });
  return rows;
}

function TypePill({ type }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={`flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.pill}`}>
      <Icon size={10} /> {meta.label}
    </span>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            value === t.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Create or edit a quiz. When creating, the author first picks what the quiz
// belongs to — a topic within a course, or a particular class. When editing,
// that target is fixed.
function QuizEditorModal({ courses, classes, editing, onClose }) {
  const dispatch = useDispatch();
  const courseOptions = courses.filter((c) => c.topics.length > 0);

  const [type, setType] = useState(editing?.type || "course");
  const [courseId, setCourseId] = useState(editing?.course?.id || courseOptions[0]?.id || "");
  const [topicId, setTopicId] = useState(() => {
    if (editing?.topic) return editing.topic.id;
    const first = courseOptions[0];
    return first?.topics.find((t) => !hasQuestions(t.quiz))?.id || "";
  });
  const freeClasses = classes.filter((c) => !hasQuestions(c.quiz));
  const [classId, setClassId] = useState(editing?.cls?.id || freeClasses[0]?.id || "");

  const [title, setTitle] = useState(editing?.quiz.title || "");
  const [passingScore, setPassingScore] = useState(editing?.quiz.passingScore || 70);
  const [timeLimitMins, setTimeLimitMins] = useState(editing?.quiz.timeLimitMins || "");
  const [maxAttempts, setMaxAttempts] = useState(editing?.quiz.maxAttempts || "");
  const [showAnswers, setShowAnswers] = useState(editing ? editing.quiz.showAnswers !== false : true);
  const [questions, setQuestions] = useState(editing?.quiz.questions || []);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedTopics = selectedCourse?.topics || [];

  const changeCourse = (id) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    setTopicId(course?.topics.find((t) => !hasQuestions(t.quiz))?.id || "");
  };

  const targetChosen = type === "course" ? !!(courseId && topicId) : !!classId;
  const canSave = targetChosen && questions.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const payload = { title, passingScore, timeLimitMins, maxAttempts, showAnswers, questions };
    if (type === "course") {
      const revision = !!selectedCourse?.isLiveForTrainer;
      dispatch(setTopicQuiz({ courseId, topicId, ...payload, revision }));
      if (revision) {
        dispatch(pushToast({ type: "success", message: "Quiz saved to your course update — submit the update for approval from the course page." }));
        onClose();
        return;
      }
    } else {
      dispatch(setClassQuiz({ classId, ...payload }));
    }
    dispatch(pushToast({ type: "success", message: editing ? "Quiz updated." : "Quiz created." }));
    onClose();
  };

  return (
    <ModalOverlay>
      <div className="max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">{editing ? "Edit quiz" : "Create a quiz"}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">This quiz belongs to</label>
            {editing ? (
              <div className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <TypePill type={editing.type} />
                <span className="truncate font-medium">
                  {editing.belongsTo}
                  {editing.type === "course" && ` › ${editing.topic.title}`}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {["course", "class"].map((t) => {
                  const Icon = TYPE_META[t].icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                        type === t ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <Icon size={14} /> A {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!editing && type === "course" && (
            courseOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 p-3 text-xs text-stone-400">
                None of your courses have topics yet. Add a topic to a course first, then create its quiz here.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">Course</label>
                  <select value={courseId} onChange={(e) => changeCourse(e.target.value)} className={inputClass}>
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">Topic</label>
                  <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputClass}>
                    {selectedTopics.every((t) => hasQuestions(t.quiz)) && <option value="">Every topic already has a quiz</option>}
                    {selectedTopics.map((t) => (
                      <option key={t.id} value={t.id} disabled={hasQuestions(t.quiz)}>
                        {t.title}
                        {hasQuestions(t.quiz) ? " (has a quiz)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          )}

          {!editing && type === "class" && (
            freeClasses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 p-3 text-xs text-stone-400">
                {classes.length === 0 ? "You don't have any classes yet." : "Every one of your classes already has a quiz."}
              </p>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
                  {freeClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-stone-400">Only learners in this class will see and take it.</p>
              </div>
            )
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Quiz title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional, e.g. Module 1 knowledge check"
              className={inputClass}
            />
          </div>

          <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-[140px_1fr] sm:items-center">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Attempts allowed</label>
              <input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="Unlimited"
                className={inputClass}
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-stone-600 sm:mt-5">
              <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="mt-0.5 accent-brand-700" />
              <span>
                <span className="font-semibold text-stone-700">Show the correct answers after the last attempt</span>
                <span className="block text-[11px] text-stone-400">
                  {maxAttempts ? "Revealed once a learner passes or uses all their attempts." : "With unlimited attempts, revealed once a learner passes."}
                </span>
              </span>
            </label>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <QuizBuilder
              passingScore={passingScore}
              onPassingScoreChange={setPassingScore}
              timeLimitMins={timeLimitMins}
              onTimeLimitChange={setTimeLimitMins}
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {!canSave && (
            <span className="mr-auto text-[11px] text-stone-400">
              {targetChosen ? "Add at least one question." : "Choose what this quiz belongs to."}
            </span>
          )}
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? "Save changes" : "Create quiz"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function QuizPreviewModal({ row, onClose }) {
  return (
    <ModalOverlay>
      <div className="max-h-[90vh] w-full max-w-xl animate-scale-in overflow-y-auto rounded-2xl bg-stone-50 p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-stone-900">{row.title}</h2>
            <p className="text-xs text-stone-400">
              {row.belongsTo}
              {row.type === "course" && ` › ${row.topic.title}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>
        <QuizPreview quiz={row.quiz} />
      </div>
    </ModalOverlay>
  );
}

// Trainers create and edit quizzes on the courses they authored and the
// classes they run. Admins see every quiz but only view them — authoring is
// the trainers' job.
function QuizManager({ currentUser }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const allCourses = useSelector(selectAllCourses);
  const allClasses = useSelector(selectAllClasses);
  const enrollments = useSelector(selectAllEnrollments);
  const classAttempts = useSelector((state) => state.classes.classQuizAttempts);
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState(null); // { editing: row | null }
  const [viewing, setViewing] = useState(null);

  const isAdmin = currentUser.role === "admin";
  const classes = isAdmin ? allClasses : allClasses.filter((c) => c.trainerId === currentUser.id);
  // Trainers work on their own courses; for a live course that means its
  // pending update (quiz changes go through re-approval like topics do).
  const courses = useMemo(
    () =>
      isAdmin
        ? allCourses
        : allCourses
            .filter((c) => c.createdBy === currentUser.id)
            .map((c) =>
              (c.status || "approved") === "approved" ? { ...c, topics: editableTopicsOf(c), isLiveForTrainer: true } : c
            ),
    [isAdmin, allCourses, currentUser.id]
  );

  const rows = collectQuizzes(courses, classes);
  const visible = filter === "all" ? rows : rows.filter((r) => r.type === filter);

  const attemptCount = (row) =>
    row.type === "course"
      ? enrollments
          .filter((e) => e.courseId === row.course.id)
          .reduce((sum, e) => sum + (e.topicQuizzes?.[row.topic.id]?.attempts?.length ?? 0), 0)
      : classAttempts.filter((a) => a.classId === row.cls.id).length;

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: `Delete "${row.title}"?`,
      message: "Learners will no longer see this quiz.",
      confirmLabel: "Delete quiz",
      tone: "danger",
    });
    if (!ok) return;
    if (row.type === "course") dispatch(removeTopicQuiz({ courseId: row.course.id, topicId: row.topic.id, revision: !!row.course.isLiveForTrainer }));
    else dispatch(removeClassQuiz({ classId: row.cls.id }));
    dispatch(pushToast({ type: "success", message: "Quiz deleted." }));
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: `All (${rows.length})` },
            { id: "course", label: "Course quizzes" },
            { id: "class", label: "Class quizzes" },
          ]}
        />
        {!isAdmin && (
          <button
            onClick={() => setEditor({ editing: null })}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Create quiz
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
          {isAdmin ? "No quizzes here yet." : "No quizzes here yet. Create one and choose whether it belongs to a course or a class."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Belongs to</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Pass mark</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-800">{row.title}</p>
                    {row.quiz.timeLimitMins ? (
                      <p className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Clock size={10} /> {row.quiz.timeLimitMins} min limit
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <TypePill type={row.type} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-700">{row.belongsTo}</p>
                    <p className="text-[10px] text-stone-400">{row.detail}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{row.quiz.questions.length}</td>
                  <td className="px-4 py-3 text-stone-500">{row.quiz.passingScore}%</td>
                  <td className="px-4 py-3 text-stone-500">{attemptCount(row)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setViewing(row)}
                        className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                      >
                        <Eye size={11} /> View
                      </button>
                      {!isAdmin && (
                        <>
                          <button
                            onClick={() => setEditor({ editing: row })}
                            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            title="Delete quiz"
                            className="rounded-lg border border-stone-200 px-2 py-1.5 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && <QuizEditorModal courses={courses} classes={classes} editing={editor.editing} onClose={() => setEditor(null)} />}
      {viewing && <QuizPreviewModal row={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

// Learners see every quiz they can take: topic quizzes from the courses
// they're enrolled in, plus the quizzes of classes they belong to.
function LearnerQuizzes({ currentUser }) {
  const navigate = useNavigate();
  const allCourses = useSelector(selectAllCourses);
  const allClasses = useSelector(selectAllClasses);
  const enrollments = useSelector(selectAllEnrollments).filter((e) => e.userId === currentUser.id);
  const classAttempts = useSelector((state) => state.classes.classQuizAttempts).filter((a) => a.userId === currentUser.id);
  const [filter, setFilter] = useState("all");

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const courses = allCourses.filter((c) => enrolledIds.has(c.id));
  const classes = allClasses.filter((c) => c.memberIds.includes(currentUser.id));

  const rows = collectQuizzes(courses, classes).map((row) => {
    const attempts =
      row.type === "course"
        ? enrollments.find((e) => e.courseId === row.course.id)?.topicQuizzes?.[row.topic.id]?.attempts ?? []
        : classAttempts.filter((a) => a.classId === row.cls.id);
    const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
    const passed = attempts.some((a) => a.passed);
    const outOfAttempts = !!row.quiz.maxAttempts && attempts.length >= row.quiz.maxAttempts;
    const to = row.type === "course" ? `/course/${row.course.id}/topic/${row.topic.id}/quiz` : `/classes/${row.cls.id}/quiz`;
    return { ...row, attempts, best, passed, outOfAttempts, to };
  });

  const visible = filter === "todo" ? rows.filter((r) => !r.passed) : filter === "passed" ? rows.filter((r) => r.passed) : rows;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "all", label: `All (${rows.length})` },
          { id: "todo", label: "To do" },
          { id: "passed", label: "Passed" },
        ]}
      />

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
          {rows.length === 0 ? "No quizzes yet. Enroll in a course or join a class to see its quizzes here." : "Nothing in this list."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((row) => (
            <div key={row.key} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <TypePill type={row.type} />
                {row.passed ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 size={12} /> Passed
                  </span>
                ) : row.outOfAttempts ? (
                  <span className="text-[10px] font-bold text-rose-600">No attempts left</span>
                ) : row.attempts.length ? (
                  <span className="text-[10px] font-bold text-amber-700">Not passed yet</span>
                ) : (
                  <span className="text-[10px] font-bold text-stone-400">Not started</span>
                )}
              </div>
              <h3 className="text-sm font-bold leading-snug text-stone-900">{row.title}</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                {row.belongsTo}
                {row.type === "course" && ` › ${row.topic.title}`}
              </p>
              <p className="mt-3 text-[11px] text-stone-400">
                {row.quiz.questions.length} questions · pass mark {row.quiz.passingScore}%
                {row.quiz.timeLimitMins ? ` · ${row.quiz.timeLimitMins} min` : ""}
                {row.quiz.maxAttempts ? ` · ${row.attempts.length}/${row.quiz.maxAttempts} attempts used` : ""}
                {row.best !== null && ` · best ${row.best}%`}
              </p>
              <button
                onClick={() => navigate(row.to)}
                className={`mt-4 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  row.passed || row.outOfAttempts ? "border border-stone-200 text-stone-700 hover:bg-stone-50" : "bg-brand-700 text-white hover:bg-brand-800"
                }`}
              >
                {row.passed ? "Review" : row.outOfAttempts ? "View results" : row.attempts.length ? "Try again" : "Start quiz"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuizzesPage({ onMenuClick }) {
  const currentUser = useSelector(selectCurrentUser);
  const isLearner = currentUser.role === "learner";

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header
        title={isLearner ? "My Quizzes" : "Quizzes"}
        subtitle={
          isLearner
            ? "Every quiz from your courses and classes, in one place."
            : currentUser.role === "admin"
            ? "Every quiz across all courses and classes. Trainers create and edit them."
            : "Create quizzes and attach each one to a topic in your course or to one of your classes."
        }
        onMenuClick={onMenuClick}
      />
      {isLearner ? <LearnerQuizzes currentUser={currentUser} /> : <QuizManager currentUser={currentUser} />}
    </div>
  );
}
