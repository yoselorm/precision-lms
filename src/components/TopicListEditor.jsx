import React, { useState } from "react";
import { Plus, Trash2, PlayCircle, FileText, GripVertical } from "lucide-react";
import FileOrUrlInput from "./FileOrUrlInput";

const empty = { title: "", type: "video", durationMins: 10, videoUrl: "", body: "" };

// Manages a working list of topics (modules) with per-topic video URL or
// text body. Used both when creating a course from scratch and when a
// trainer/admin appends material to a course that already exists.
export default function TopicListEditor({ topics, onChange }) {
  const [draft, setDraft] = useState(empty);

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const addTopic = () => {
    if (!draft.title.trim()) return;
    onChange([...topics, draft]);
    setDraft(empty);
  };

  const removeTopic = (index) => {
    onChange(topics.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-stone-600">Topics ({topics.length})</label>

      {topics.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {topics.map((t, i) => {
            const Icon = t.type === "video" ? PlayCircle : FileText;
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                <GripVertical size={12} className="shrink-0 text-stone-300" />
                <Icon size={13} className="shrink-0 text-stone-400" />
                <span className="flex-1 truncate font-medium text-stone-700">{t.title}</span>
                <span className="shrink-0 text-[10px] text-stone-400">{t.durationMins}m</span>
                <button type="button" onClick={() => removeTopic(i)} className="shrink-0 text-stone-400 hover:text-rose-600">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-dashed border-stone-300 p-3">
        <div className="flex gap-2">
          <input
            value={draft.title}
            onChange={(e) => updateDraft("title", e.target.value)}
            placeholder="Topic title, e.g. Setting up your workspace"
            className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
          />
          <select
            value={draft.type}
            onChange={(e) => updateDraft("type", e.target.value)}
            className="shrink-0 rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-brand-600"
          >
            <option value="video">Video</option>
            <option value="reading">Text</option>
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
          <FileOrUrlInput
            value={draft.videoUrl}
            onChange={(v) => updateDraft("videoUrl", v)}
            accept="video/*"
            kind="video"
            label={null}
          />
        ) : (
          <textarea
            value={draft.body}
            onChange={(e) => updateDraft("body", e.target.value)}
            rows={2}
            placeholder="Text content for this topic..."
            className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-600"
          />
        )}

        <button
          type="button"
          onClick={addTopic}
          className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900"
        >
          <Plus size={13} /> Add topic
        </button>
      </div>
    </div>
  );
}
