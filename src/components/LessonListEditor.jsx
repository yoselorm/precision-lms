import React, { useState } from "react";
import { Plus, Trash2, PlayCircle, FileText, File, Paperclip, Loader2, Pencil, Check, X } from "lucide-react";
import FileOrUrlInput from "./FileOrUrlInput";
import { MoveButtons, moved } from "./MoveButtons";
import {
  addLesson as addLessonThunk,
  removeLesson as removeLessonThunk,
  editLesson as editLessonThunk,
  reorderLessons,
} from "../store/slices/coursesSlice";
import { useApiAction } from "../hooks/useApiAction";

const empty = { title: "", description: "", type: "video", durationMins: 10, videoUrl: "", body: "", fileUrl: "" };
const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };

const fieldClass = "w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600";

export function formatFileSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

// The fields shared by "add a lesson" and "edit a lesson".
function LessonFields({ value, onChange, onUploadingChange }) {
  const update = (field, v) => onChange({ ...value, [field]: v });
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px_110px]">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-stone-600">
            Lesson title <span className="text-rose-500">*</span>
          </label>
          <input value={value.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Setting up your workspace" className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-stone-600">Type</label>
          <select value={value.type} onChange={(e) => update("type", e.target.value)} className={fieldClass}>
            <option value="video">Video</option>
            <option value="text">Text</option>
            <option value="document">Document</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-stone-600">Duration (mins)</label>
          <input type="number" min="1" value={value.durationMins} onChange={(e) => update("durationMins", e.target.value)} className={fieldClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-stone-600">
          Description <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea value={value.description} onChange={(e) => update("description", e.target.value)} rows={2} placeholder="What this lesson covers" className={fieldClass} />
      </div>

      {value.type === "video" ? (
        <FileOrUrlInput value={value.videoUrl} onChange={(v) => update("videoUrl", v)} accept="video/*" kind="video" label={null} onUploadingChange={onUploadingChange} />
      ) : value.type === "document" ? (
        <FileOrUrlInput value={value.fileUrl} onChange={(v) => update("fileUrl", v)} accept=".pdf,.doc,.docx" kind="document" label={null} onUploadingChange={onUploadingChange} />
      ) : (
        <textarea value={value.body} onChange={(e) => update("body", e.target.value)} rows={3} placeholder="Text content for this lesson..." className={fieldClass} />
      )}
    </>
  );
}

// Manages a topic's lessons (video, text, or document) — lists, edits and
// reorders what's there and offers a form to add more. Lives one level under
// CourseTopicsManager, one instance per topic. `readOnly` lists the lessons
// without any editing controls.
export default function LessonListEditor({ courseId, topicId, lessons, readOnly = false }) {
  const [run, busy] = useApiAction();
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(null); // a lesson's fields plus its id
  const [fileUploading, setFileUploading] = useState(false);

  const addLesson = async () => {
    if (!draft.title.trim()) return;
    if (await run(addLessonThunk({ courseId, topicId, ...draft, title: draft.title.trim() }))) setDraft(empty);
  };

  const saveLesson = async () => {
    if (!editing.title.trim()) return;
    const { id, ...fields } = editing;
    const ok = await run(editLessonThunk({ courseId, lessonId: id, ...fields, title: fields.title.trim() }), { successMessage: "Lesson updated." });
    if (ok) setEditing(null);
  };

  const removeLesson = (lessonId) => run(removeLessonThunk({ courseId, lessonId }));
  const moveLesson = (from, to) => run(reorderLessons({ courseId, lessonIds: moved(lessons, from, to) }));

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-stone-600">Lessons ({lessons.length})</label>

      {lessons.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {lessons.map((l, index) => {
            if (editing?.id === l.id) {
              return (
                <div key={l.id} className="space-y-3 rounded-lg border border-brand-300 bg-white p-3">
                  <LessonFields value={editing} onChange={setEditing} onUploadingChange={setFileUploading} />
                  <div className="flex gap-2 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      onClick={saveLesson}
                      disabled={busy || fileUploading || !editing.title.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save lesson
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              );
            }
            const Icon = LESSON_ICONS[l.type] || FileText;
            return (
              <div key={l.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  {!readOnly && lessons.length > 1 && <MoveButtons index={index} count={lessons.length} onMove={moveLesson} disabled={busy} />}
                  <Icon size={13} className="shrink-0 text-stone-400" />
                  <span className="flex-1 truncate font-medium text-stone-700">{l.title}</span>
                  {l.resources?.length > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-stone-400">
                      <Paperclip size={10} /> {l.resources.length}
                    </span>
                  )}
                  <span className="shrink-0 text-[10px] text-stone-400">{l.durationMins} min</span>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            id: l.id,
                            title: l.title,
                            description: l.description,
                            type: l.type,
                            durationMins: l.durationMins,
                            videoUrl: l.videoUrl,
                            body: l.body,
                            fileUrl: l.fileUrl,
                          })
                        }
                        disabled={busy}
                        title="Edit lesson"
                        className="shrink-0 text-stone-400 hover:text-brand-700 disabled:opacity-40"
                      >
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => removeLesson(l.id)} disabled={busy} title="Delete lesson" className="shrink-0 text-stone-400 hover:text-rose-600 disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
                {l.description && <p className="ml-[46px] mt-0.5 line-clamp-2 text-[11px] text-stone-500">{l.description}</p>}
              </div>
            );
          })}
        </div>
      )}

      {readOnly ? (
        lessons.length === 0 && <p className="text-xs text-stone-400">No lessons yet.</p>
      ) : (
        <div className="space-y-3 rounded-lg border border-dashed border-stone-300 p-3">
          <LessonFields value={draft} onChange={setDraft} onUploadingChange={setFileUploading} />
          <div className="flex justify-start border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={addLesson}
              disabled={busy || fileUploading || !draft.title.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
