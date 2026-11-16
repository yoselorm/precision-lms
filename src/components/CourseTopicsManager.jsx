import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import LessonListEditor from "./LessonListEditor";
import { MoveButtons, moved } from "./MoveButtons";
import { addTopic, removeTopic, editTopic, reorderTopics, editableTopicsOf } from "../store/slices/coursesSlice";
import { useApiAction } from "../hooks/useApiAction";

const fieldClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

export default function CourseTopicsManager({ course, readOnly = false, useRevision = false }) {
  const topics = useRevision ? editableTopicsOf(course) : course.topics;
  const [run, busy] = useApiAction();
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [editing, setEditing] = useState(null); // { id, title, description }

  const saveTopic = async (e) => {
    e.preventDefault();
    if (!editing.title.trim()) return;
    const ok = await run(editTopic({ courseId: course.id, topicId: editing.id, title: editing.title.trim(), description: editing.description }), {
      successMessage: "Topic updated.",
    });
    if (ok) setEditing(null);
  };

  const moveTopic = (from, to) => run(reorderTopics({ courseId: course.id, topicIds: moved(topics, from, to) }));

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    if (!(await run(addTopic({ courseId: course.id, title: newTopicTitle.trim(), description: newTopicDescription })))) return;
    setNewTopicTitle("");
    setNewTopicDescription("");
  };

  if (course.contentStatus === "loading" || course.contentStatus === "idle") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" /> Loading topics...
      </div>
    );
  }
  if (course.contentStatus === "unavailable" || course.contentStatus === "failed") {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
        {course.contentError || "Couldn't load this course's topics."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topics.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          {readOnly ? "No topics yet." : "No topics yet — add the first one below."}
        </div>
      )}

      {topics.map((topic, index) => {
        const quizQuestionCount = topic.quiz?.questions?.length ?? 0;
        const quizLabel = quizQuestionCount ? `quiz: ${quizQuestionCount} questions` : "no quiz";
        if (editing?.id === topic.id) {
          return (
            <form key={topic.id} onSubmit={saveTopic} className="space-y-3 rounded-2xl border border-brand-300 bg-white p-4">
              <p className="text-sm font-bold text-stone-800">Edit topic</p>
              <input
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                placeholder="Topic title"
                className={fieldClass}
              />
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={2}
                placeholder="What this topic covers (optional)"
                className={fieldClass}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !editing.title.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save topic
                </button>
                <button type="button" onClick={() => setEditing(null)} className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">
                  <X size={13} /> Cancel
                </button>
              </div>
            </form>
          );
        }
        return (
          <div key={topic.id} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              {!readOnly && topics.length > 1 && <MoveButtons index={index} count={topics.length} onMove={moveTopic} disabled={busy} />}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-stone-900">{topic.title}</h4>
                {topic.description && <p className="mt-0.5 text-xs text-stone-500">{topic.description}</p>}
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {topic.lessons.length} lesson{topic.lessons.length !== 1 ? "s" : ""} ·{" "}
                  {quizLabel} ·{" "}
                  <Link to="/quizzes" className="font-semibold text-brand-700 hover:underline">
                    {readOnly ? "view in Quizzes" : quizQuestionCount ? "edit in Quizzes" : "add in Quizzes"}
                  </Link>
                </p>
              </div>
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setEditing({ id: topic.id, title: topic.title, description: topic.description || "" })}
                    disabled={busy}
                    title="Edit this topic"
                    className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => run(removeTopic({ courseId: course.id, topicId: topic.id }))}
                    disabled={busy}
                    title="Remove this topic"
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              )}
            </div>

            <LessonListEditor courseId={course.id} topicId={topic.id} lessons={topic.lessons} readOnly={readOnly} />
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
          <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add topic
          </button>
        </form>
      )}
    </div>
  );
}
