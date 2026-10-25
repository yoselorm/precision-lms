import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2, PlayCircle, FileText, File, GripVertical } from "lucide-react";
import FileOrUrlInput from "./FileOrUrlInput";
import { addLessonToTopic, removeLessonFromTopic } from "../store/slices/coursesSlice";

const empty = { title: "", type: "video", durationMins: 10, videoUrl: "", body: "", fileUrl: "" };
const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };

// Manages a topic's lessons (video, text, or document) — lists what's
// already there and offers a draft-list-then-add form to append more.
// Lives one level under CourseTopicsManager, one instance per topic.
// `readOnly` lists the lessons without any editing controls.
export default function LessonListEditor({ courseId, topicId, lessons, readOnly = false, revision = false }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(empty);

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const addLesson = () => {
    if (!draft.title.trim()) return;
    dispatch(addLessonToTopic({ courseId, topicId, ...draft, revision }));
    setDraft(empty);
  };

  const removeLesson = (lessonId) => {
    dispatch(removeLessonFromTopic({ courseId, topicId, lessonId, revision }));
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-stone-600">Lessons ({lessons.length})</label>

      {lessons.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {lessons.map((l) => {
            const Icon = LESSON_ICONS[l.type] || FileText;
            return (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                <GripVertical size={12} className="shrink-0 text-stone-300" />
                <Icon size={13} className="shrink-0 text-stone-400" />
                <span className="flex-1 truncate font-medium text-stone-700">{l.title}</span>
                <span className="shrink-0 text-[10px] text-stone-400">{l.durationMins}m</span>
                {!readOnly && (
                  <button type="button" onClick={() => removeLesson(l.id)} className="shrink-0 text-stone-400 hover:text-rose-600">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {readOnly ? (
        lessons.length === 0 && <p className="text-xs text-stone-400">No lessons yet.</p>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-stone-300 p-3">
          <div className="flex gap-2">
            <input
              value={draft.title}
              onChange={(e) => updateDraft("title", e.target.value)}
              placeholder="Lesson title, e.g. Setting up your workspace"
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
            />
            <select
              value={draft.type}
              onChange={(e) => updateDraft("type", e.target.value)}
              className="shrink-0 rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-brand-600"
            >
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="document">Document</option>
            </select>
            <input
              type="number"
              min="1"
              value={draft.durationMins}
              onChange={(e) => updateDraft("durationMins", e.target.value)}
              className="w-16 shrink-0 rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-brand-600"
              title="Duration (mins)"
            />
          </div>

          {draft.type === "video" ? (
            <FileOrUrlInput value={draft.videoUrl} onChange={(v) => updateDraft("videoUrl", v)} accept="video/*" kind="video" label={null} />
          ) : draft.type === "document" ? (
            <FileOrUrlInput value={draft.fileUrl} onChange={(v) => updateDraft("fileUrl", v)} accept=".pdf,.doc,.docx" kind="document" label={null} />
          ) : (
            <textarea
              value={draft.body}
              onChange={(e) => updateDraft("body", e.target.value)}
              rows={2}
              placeholder="Text content for this lesson..."
              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
            />
          )}

          <button
            type="button"
            onClick={addLesson}
            className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900"
          >
            <Plus size={13} /> Add lesson
          </button>
        </div>
      )}
    </div>
  );
}
