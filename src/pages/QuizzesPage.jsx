import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, CalendarDays, CheckCircle2, Clock, Eye, Layers, Pencil, PlayCircle, Plus, Trash2, X } from "lucide-react";
import Header from "../components/Header";
import QuizBuilder from "../components/QuizBuilder";
import QuizPreview from "../components/QuizPreview";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses, saveQuiz, removeQuiz, fetchCourseContent, fetchAdminQuizzes } from "../store/slices/coursesSlice";
import { selectAllClasses, setClassQuiz, removeClassQuiz, fetchClass } from "../store/slices/classesSlice";
import { useApiAction } from "../hooks/useApiAction";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";
import { pushToast } from "../store/slices/uiSlice";
import { useConfirm } from "../components/ConfirmDialog";
import ModalOverlay from "../components/ModalOverlay";
import { usePageData } from "../hooks/usePageData";
import { loadQuizzes } from "../store/loadAppData";
import { quizKey, quizRoute } from "../utils/quiz";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

const TYPE_META = {
  course: { label: "Course", icon: BookOpen, pill: "border-brand-200 bg-brand-50 text-brand-700" },
  topic: { label: "Topic", icon: Layers, pill: "border-sky-200 bg-sky-50 text-sky-700" },
  lesson: { label: "Lesson", icon: PlayCircle, pill: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  class: { label: "Class", icon: CalendarDays, pill: "border-violet-200 bg-violet-50 text-violet-700" },
};

const hasQuestions = (quiz) => (quiz?.questions?.length ?? 0) > 0;

// Flattens every quiz in the system into one list. Quizzes can belong to a
// whole course, one of its topics or lessons, or a class.
function collectQuizzes(courses, classes) {
  const rows = [];
  courses.forEach((course) => {
    if (hasQuestions(course.quiz)) {
      rows.push({
        key: `course:${course.id}`,
        type: "course",
        owner: { type: "course", id: course.id },
        quiz: course.quiz,
        title: course.quiz.title || `${course.title} final quiz`,
        belongsTo: course.title,
        detail: "Whole course",
        course,
      });
    }
    course.topics.forEach((topic) => {
      if (hasQuestions(topic.quiz)) {
        rows.push({
          key: `topic:${topic.id}`,
          type: "topic",
          owner: { type: "topic", id: topic.id },
          quiz: topic.quiz,
          title: topic.quiz.title || `${topic.title} quiz`,
          belongsTo: course.title,
          detail: topic.title,
          course,
        });
      }
      topic.lessons.forEach((lesson) => {
        if (!hasQuestions(lesson.quiz)) return;
        rows.push({
          key: `lesson:${lesson.id}`,
          type: "lesson",
          owner: { type: "lesson", id: lesson.id },
          quiz: lesson.quiz,
          title: lesson.quiz.title || `${lesson.title} quiz`,
          belongsTo: course.title,
          detail: `${topic.title} › ${lesson.title}`,
          course,
        });
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
// belongs to — a whole course, a topic or lesson within one, or a class.
// When editing, that target is fixed.
function QuizEditorModal({ courses, classes, editing, onClose }) {
  const [run, saving] = useApiAction();
  // Saved quizzes come back without their correct answers, so an edit
  // starts from a blank question list and replaces the quiz on save.
  const answersUnknown = !!editing && editing.quiz.answersKnown === false;
  const [type, setType] = useState(editing?.type || "topic");
  // Courses offered for each kind of quiz.
  const courseOptions =
    type === "course" ? courses : type === "lesson" ? courses.filter((c) => c.topics.some((t) => t.lessons.length)) : courses.filter((c) => c.topics.length);
  const [courseId, setCourseId] = useState(editing?.course?.id || courseOptions[0]?.id || "");
  const [topicId, setTopicId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const freeClasses = classes.filter((c) => !hasQuestions(c.quiz));
  const [classId, setClassId] = useState(editing?.cls?.id || freeClasses[0]?.id || "");

  const [title, setTitle] = useState(editing?.quiz.title || "");
  const [passingScore, setPassingScore] = useState(editing?.quiz.passingScore || 70);
  const [timeLimitMins, setTimeLimitMins] = useState(editing?.quiz.timeLimitMins || "");
  const [maxAttempts, setMaxAttempts] = useState(editing?.quiz.maxAttempts || "");
  const [showAnswers, setShowAnswers] = useState(editing ? editing.quiz.showAnswers !== false : true);
  const [questions, setQuestions] = useState(answersUnknown ? [] : editing?.quiz.questions || []);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedTopics = selectedCourse?.topics || [];
  const allLessons = selectedTopics.flatMap((t) => t.lessons.map((l) => ({ ...l, topicTitle: t.title })));

  // Keep the topic/lesson pick valid for the chosen course, preferring ones
  // without a quiz yet.
  useEffect(() => {
    if (editing) return;
    if (!courseOptions.some((c) => c.id === courseId)) setCourseId(courseOptions[0]?.id || "");
    setTopicId((current) => (selectedTopics.some((t) => t.id === current) ? current : selectedTopics.find((t) => !hasQuestions(t.quiz))?.id || ""));
    setLessonId((current) => (allLessons.some((l) => l.id === current) ? current : allLessons.find((l) => !hasQuestions(l.quiz))?.id || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, courseId, courses]);

  const owner = editing?.owner ?? (type === "course" ? { type, id: courseId } : type === "topic" ? { type, id: topicId } : type === "lesson" ? { type, id: lessonId } : null);
  const courseAlreadyHasQuiz = !editing && type === "course" && hasQuestions(selectedCourse?.quiz);
  const targetChosen = type === "class" ? !!classId : !!owner?.id && !courseAlreadyHasQuiz;
  const canSave = targetChosen && questions.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const quiz = { title, passingScore, timeLimitMins, maxAttempts, showAnswers, questions };
    const liveUpdate = type !== "class" && !!selectedCourse?.isLiveForTrainer;
    const ok =
      type !== "class"
        ? await run(saveQuiz({ courseId: editing?.course?.id ?? courseId, owner, quiz }), {
            successMessage: liveUpdate
              ? "Quiz saved to your course update — submit the update for approval from the course page."
              : editing
              ? "Quiz updated."
              : "Quiz created.",
          })
        : await run(setClassQuiz({ classId, ...quiz }), { successMessage: editing ? "Quiz updated." : "Quiz created." });
    if (ok) onClose();
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
                  {editing.type !== "class" && editing.type !== "course" && ` › ${editing.detail}`}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["course", "topic", "lesson", "class"].map((t) => {
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

          {!editing && type !== "class" && (
            courseOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 p-3 text-xs text-stone-400">
                {type === "course"
                  ? "You don't have any courses yet."
                  : type === "topic"
                  ? "None of your courses have topics yet. Add a topic to a course first, then create its quiz here."
                  : "None of your courses have lessons yet. Add a lesson first, then create its quiz here."}
              </p>
            ) : (
              <div className={`grid gap-3 ${type === "course" ? "" : "sm:grid-cols-2"}`}>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">Course</label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                {type === "topic" && (
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
                )}
                {type === "lesson" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">Lesson</label>
                    <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={inputClass}>
                      {allLessons.every((l) => hasQuestions(l.quiz)) && <option value="">Every lesson already has a quiz</option>}
                      {allLessons.map((l) => (
                        <option key={l.id} value={l.id} disabled={hasQuestions(l.quiz)}>
                          {l.topicTitle} › {l.title}
                          {hasQuestions(l.quiz) ? " (has a quiz)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          )}
          {courseAlreadyHasQuiz && (
            <p className="text-[11px] text-rose-600">This course already has a course quiz — edit that one instead.</p>
          )}
          {!editing && type === "course" && !courseAlreadyHasQuiz && (
            <p className="text-[11px] text-stone-400">A course quiz covers the whole course — for example a final assessment taken at the end.</p>
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
            {answersUnknown && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                The server doesn't send back a saved quiz's correct answers, so add the questions again and mark their answers. Saving
                replaces the current {editing.quiz.questions.length}-question quiz.
              </p>
            )}
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
              {row.type !== "class" && ` › ${row.detail}`}
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
  const [run] = useApiAction();
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
            // A live course's quizzes are only editable through its open
            // update, so without one there's nothing to manage here.
            .map((c) => (c.status === "approved" ? { ...c, topics: c.revision?.topics ?? [], isLiveForTrainer: true } : c)),
    [isAdmin, allCourses, currentUser.id]
  );

  // Quizzes live on topics and classes, which the lists don't include.
  // Trainers load each of their courses and classes. Admins load every
  // course's topics (which come with their quizzes) and the admin quiz list
  // for class quizzes.
  const courseIds = courses.map((c) => c.id).join(",");
  const classIds = classes.map((c) => c.id).join(",");
  useEffect(() => {
    courseIds.split(",").filter(Boolean).forEach((id) => dispatch(fetchCourseContent(id)));
    if (isAdmin) dispatch(fetchAdminQuizzes());
    else classIds.split(",").filter(Boolean).forEach((id) => dispatch(fetchClass(id)));
  }, [dispatch, isAdmin, courseIds, classIds]);

  const rows = collectQuizzes(courses, classes);
  const visible = filter === "all" ? rows : rows.filter((r) => r.type === filter);

  const attemptCount = (row) =>
    row.type === "class"
      ? classAttempts.filter((a) => a.classId === row.cls.id).length
      : enrollments
          .filter((e) => e.courseId === row.course.id)
          .reduce((sum, e) => sum + (e.topicQuizzes?.[quizKey(row.owner)]?.attempts?.length ?? 0), 0);

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: `Delete "${row.title}"?`,
      message: "Learners will no longer see this quiz.",
      confirmLabel: "Delete quiz",
      tone: "danger",
    });
    if (!ok) return;
    const action =
      row.type === "class" ? removeClassQuiz({ classId: row.cls.id }) : removeQuiz({ courseId: row.course.id, owner: row.owner });
    await run(action, { successMessage: "Quiz deleted." });
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: `All (${rows.length})` },
            { id: "course", label: "Course" },
            { id: "topic", label: "Topic" },
            { id: "lesson", label: "Lesson" },
            { id: "class", label: "Class" },
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
  const dispatch = useDispatch();
  const allCourses = useSelector(selectAllCourses);
  const allClasses = useSelector(selectAllClasses);
  const enrollments = useSelector(selectAllEnrollments).filter((e) => e.userId === currentUser.id);
  const classAttempts = useSelector((state) => state.classes.classQuizAttempts).filter((a) => a.userId === currentUser.id);
  const [filter, setFilter] = useState("all");

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const courses = allCourses.filter((c) => enrolledIds.has(c.id));
  const classes = allClasses.filter((c) => c.memberIds.includes(currentUser.id));

  // Class quizzes load with each class's detail; course quizzes with each
  // enrolled course's content.
  const classIds = classes.map((c) => c.id).join(",");
  const courseIds = courses.map((c) => c.id).join(",");
  useEffect(() => {
    classIds.split(",").filter(Boolean).forEach((id) => dispatch(fetchClass(id)));
    courseIds.split(",").filter(Boolean).forEach((id) => dispatch(fetchCourseContent(id)));
  }, [dispatch, classIds, courseIds]);

  const rows = collectQuizzes(courses, classes).map((row) => {
    const attempts =
      row.type !== "class"
        ? enrollments.find((e) => e.courseId === row.course.id)?.topicQuizzes?.[quizKey(row.owner)]?.attempts ?? []
        : classAttempts.filter((a) => a.classId === row.cls.id);
    const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
    const passed = attempts.some((a) => a.passed);
    const outOfAttempts = !!row.quiz.maxAttempts && attempts.length >= row.quiz.maxAttempts;
    const to = row.type === "class" ? `/classes/${row.cls.id}/quiz` : quizRoute(row.course.id, row.owner);
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
                {row.type !== "class" && ` › ${row.detail}`}
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
  usePageData(loadQuizzes);
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
