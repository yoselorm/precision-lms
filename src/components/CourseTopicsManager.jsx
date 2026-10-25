import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import LessonListEditor from "./LessonListEditor";
import { addTopicToCourse, removeTopicFromCourse, editableTopicsOf } from "../store/slices/coursesSlice";

// The single place topic/lesson editing for a course lives — one topic per
// card, each with its own lessons (via LessonListEditor). Topic quizzes are
// authored separately on the Quizzes page. Shared by the admin course-manage
// page and a trainer managing materials for a class's attached course.
// `readOnly` (admins) shows the same content with no editing controls.
// `useRevision` works on (or shows) the course's pending update instead of
// its live topics — see topicsToEdit in coursesSlice.
export default function CourseTopicsManager({ course, readOnly = false, useRevision = false }) {
  const topics = useRevision ? editableTopicsOf(course) : course.topics;
  const revision = useRevision && !readOnly;
  const dispatch = useDispatch();
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    dispatch(addTopicToCourse({ courseId: course.id, title: newTopicTitle.trim(), description: newTopicDescription, revision }));
    setNewTopicTitle("");
    setNewTopicDescription("");
  };

  return (
    <div className="space-y-4">
      {topics.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          {readOnly ? "No topics yet." : "No topics yet — add the first one below."}
        </div>
      )}

      {topics.map((topic) => {
        const quizQuestionCount = topic.quiz?.questions?.length ?? 0;
        return (
          <div key={topic.id} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-stone-900">{topic.title}</h4>
                {topic.description && <p className="mt-0.5 text-xs text-stone-500">{topic.description}</p>}
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {topic.lessons.length} lesson{topic.lessons.length !== 1 ? "s" : ""} ·{" "}
                  {quizQuestionCount ? `quiz: ${quizQuestionCount} questions` : "no quiz"} ·{" "}
                  <Link to="/quizzes" className="font-semibold text-brand-700 hover:underline">
                    {readOnly ? "view in Quizzes" : quizQuestionCount ? "edit in Quizzes" : "add in Quizzes"}
                  </Link>
                </p>
              </div>
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => dispatch(removeTopicFromCourse({ courseId: course.id, topicId: topic.id, revision }))}
                    title="Remove this topic"
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              )}
            </div>

            <LessonListEditor courseId={course.id} topicId={topic.id} lessons={topic.lessons} readOnly={readOnly} revision={revision} />
          </div>
        );
      })}

      {!readOnly && (
        <form onSubmit={handleAddTopic} className="space-y-3 rounded-2xl border border-dashed border-stone-300 bg-white p-4">
          <p className="text-sm font-bold text-stone-800">Add a topic</p>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Topic title <span className="text-rose-500">*</span>
            </label>
            <input
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              required
              placeholder="e.g. Getting started"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              rows={2}
              placeholder="What this topic covers"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800">
            <Plus size={13} /> Add topic
          </button>
        </form>
      )}
    </div>
  );
}
