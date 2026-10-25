import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2, PlayCircle, FileText, File, GripVertical, Paperclip, X, Link2 } from "lucide-react";
import FileOrUrlInput from "./FileOrUrlInput";
import { addLessonToTopic, removeLessonFromTopic } from "../store/slices/coursesSlice";

const empty = { title: "", description: "", type: "video", durationMins: 10, videoUrl: "", body: "", fileUrl: "", resources: [] };
const LESSON_ICONS = { video: PlayCircle, text: FileText, document: File };
const RESOURCE_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z";

const fieldClass = "w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600";

export function formatFileSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

// Extra downloads attached to a lesson (PDFs, slides, spreadsheets, zips…),
// either uploaded or linked by URL.
function ResourcePicker({ resources, onChange }) {
  const inputRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState(null);

  const addFiles = (files) => {
    const added = [...files].map((f) => ({ name: f.name, url: URL.createObjectURL(f), size: f.size }));
    onChange([...resources, ...added]);
  };

  const addLink = () => {
    const url = linkUrl?.trim();
    setLinkUrl(null);
    if (!url) return;
    const href = /^https?:/i.test(url) ? url : `https://${url}`;
    onChange([...resources, { name: href.split("/").pop() || href, url: href, size: 0 }]);
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-stone-600">
        Resources <span className="font-normal text-stone-400">(optional — PDFs, docs, slides, zip files…)</span>
      </label>
      {resources.length > 0 && (
        <ul className="mb-2 space-y-1">
          {resources.map((r, i) => (
            <li key={`${r.url}-${i}`} className="flex items-center gap-2 rounded-md bg-stone-100 px-2 py-1 text-[11px] text-stone-600">
              <Paperclip size={11} className="shrink-0 text-stone-400" />
              <span className="flex-1 truncate">{r.name}</span>
              {r.size > 0 && <span className="shrink-0 text-stone-400">{formatFileSize(r.size)}</span>}
              <button type="button" onClick={() => onChange(resources.filter((_, j) => j !== i))} className="shrink-0 text-stone-400 hover:text-rose-600">
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 rounded-lg border border-dashed border-stone-300 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 hover:border-brand-500 hover:text-brand-700"
        >
          <Paperclip size={12} /> Attach files
        </button>
        {linkUrl === null ? (
          <button
            type="button"
            onClick={() => setLinkUrl("")}
            className="flex items-center gap-1 rounded-lg border border-dashed border-stone-300 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 hover:border-brand-500 hover:text-brand-700"
          >
            <Link2 size={12} /> Add link
          </button>
        ) : (
          <div className="flex min-w-[220px] flex-1 items-center gap-1.5">
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
                if (e.key === "Escape") setLinkUrl(null);
              }}
              placeholder="https://… link to a file"
              className={fieldClass}
            />
            <button type="button" onClick={addLink} className="shrink-0 rounded-md bg-brand-700 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-800">
              Add
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={RESOURCE_TYPES}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files || []);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

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
              <div key={l.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <GripVertical size={12} className="shrink-0 text-stone-300" />
                  <Icon size={13} className="shrink-0 text-stone-400" />
                  <span className="flex-1 truncate font-medium text-stone-700">{l.title}</span>
                  {l.resources?.length > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-stone-400">
                      <Paperclip size={10} /> {l.resources.length}
                    </span>
                  )}
                  <span className="shrink-0 text-[10px] text-stone-400">{l.durationMins} min</span>
                  {!readOnly && (
                    <button type="button" onClick={() => removeLesson(l.id)} className="shrink-0 text-stone-400 hover:text-rose-600">
                      <Trash2 size={13} />
                    </button>
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
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_110px]">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-600">
                Lesson title <span className="text-rose-500">*</span>
              </label>
              <input
                value={draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
                placeholder="e.g. Setting up your workspace"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-600">Type</label>
              <select value={draft.type} onChange={(e) => updateDraft("type", e.target.value)} className={fieldClass}>
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-600">Duration (mins)</label>
              <input type="number" min="1" value={draft.durationMins} onChange={(e) => updateDraft("durationMins", e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-stone-600">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
              rows={2}
              placeholder="What this lesson covers"
              className={fieldClass}
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
              rows={3}
              placeholder="Text content for this lesson..."
              className={fieldClass}
            />
          )}

          <ResourcePicker resources={draft.resources} onChange={(v) => updateDraft("resources", v)} />

          <div className="flex justify-start border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={addLesson}
              disabled={!draft.title.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={13} /> Add lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
