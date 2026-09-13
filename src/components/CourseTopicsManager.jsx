import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import LessonListEditor from "./LessonListEditor";
import QuizManageModal from "./QuizManageModal";
import { addTopicToCourse, removeTopicFromCourse, setTopicQuiz } from "../store/slices/coursesSlice";
import { pushToast } from "../store/slices/uiSlice";

// The single place topic/lesson/quiz editing for a course lives — one topic
// per card, each with its own lessons (via LessonListEditor) and its own
// knowledge-check quiz. Shared by the admin course-manage page and a
// trainer managing materials for a class's attached course.
export default function CourseTopicsManager({ course }) {
  const dispatch = useDispatch();
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [quizTopic, setQuizTopic] = useState(null);

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    dispatch(addTopicToCourse({ courseId: course.id, title: newTopicTitle.trim() }));
    setNewTopicTitle("");
  };

  return (
    <div className="space-y-4">
      {course.topics.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          No topics yet — add the first one below.
        </div>
      )}

      {course.topics.map((topic) => {
        const quizQuestionCount = topic.quiz?.questions?.length ?? 0;
        return (
          <div key={topic.id} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-stone-900">{topic.title}</h4>
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {topic.lessons.length} lesson{topic.lessons.length !== 1 ? "s" : ""} ·{" "}
                  {quizQuestionCount ? `${quizQuestionCount} quiz questions` : "no quiz yet"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setQuizTopic(topic)}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <HelpCircle size={11} /> Manage quiz
                </button>
                <button
                  onClick={() => dispatch(removeTopicFromCourse({ courseId: course.id, topicId: topic.id }))}
                  title="Remove this topic"
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>

            <LessonListEditor courseId={course.id} topicId={topic.id} lessons={topic.lessons} />
          </div>
        );
      })}

      <form onSubmit={handleAddTopic} className="flex gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-4">
        <input
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
          placeholder="New topic title, e.g. Getting started"
          className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800">
          <Plus size={13} /> Add topic
        </button>
      </form>

      {quizTopic && (
        <QuizManageModal
          title="Manage topic quiz"
          subtitle={quizTopic.title}
          quiz={quizTopic.quiz}
          onSave={(payload) => {
            dispatch(setTopicQuiz({ courseId: course.id, topicId: quizTopic.id, ...payload }));
            dispatch(pushToast({ type: "success", message: `Quiz saved for "${quizTopic.title}".` }));
          }}
          onClose={() => setQuizTopic(null)}
        />
      )}
    </div>
  );
}
