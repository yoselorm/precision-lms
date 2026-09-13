import React, { useId, useRef, useState } from "react";
import { Upload, Link2, X } from "lucide-react";

// Generic "give me media" control: upload from the local system (creates an
// in-browser object URL — fine for a demo, would be replaced by a real
// upload endpoint later) or paste a URL directly.
export default function FileOrUrlInput({ value, onChange, accept, kind = "file", label }) {
  const [mode, setMode] = useState("upload");
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const inputId = useId();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFileName(file.name);
    onChange(objectUrl);
  };

  const clear = () => {
    setFileName("");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</label>}

      <div className="mb-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
            mode === "upload" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-500"
          }`}
        >
          <Upload size={11} /> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
            mode === "url" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-500"
          }`}
        >
          <Link2 size={11} /> URL
        </button>
      </div>

      {mode === "upload" ? (
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} className="hidden" id={inputId} />
          <label
            htmlFor={inputId}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:border-brand-500 hover:text-brand-700"
          >
            <Upload size={13} />
            {kind === "image" ? "Choose image" : kind === "document" ? "Choose document file" : "Choose video file"}
          </label>
          {(fileName || value) && (
            <span className="flex items-center gap-1 truncate rounded-lg bg-stone-100 px-2 py-1 text-[11px] text-stone-500">
              {fileName || "Uploaded"}
              <button type="button" onClick={clear} className="text-stone-400 hover:text-rose-600">
                <X size={11} />
              </button>
            </span>
          )}
          {fileName && (kind === "video" || kind === "document") && (
            <p className="basis-full text-[10px] text-amber-600">
              Uploaded files live in this browser tab only and won't survive a refresh — paste a URL instead for something that sticks around.
            </p>
          )}
        </div>
      ) : (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={kind === "image" ? "Paste an image URL" : kind === "document" ? "Document URL (PDF/Word link)" : "Video URL (mp4 link or embed URL)"}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-brand-600"
        />
      )}
    </div>
  );
}
