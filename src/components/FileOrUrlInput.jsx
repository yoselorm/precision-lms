import React, { useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Upload, Link2, X, Loader2 } from "lucide-react";
import { uploadFile, uploadLargeFile, MAX_LARGE_UPLOAD_BYTES } from "../api/client";
import { pushToast } from "../store/slices/uiSlice";

const MAX_SMALL_UPLOAD_BYTES = 20 * 1024 * 1024;

const formatSize = (bytes) => (bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`);

// Generic "give me media" control: upload from the local system or paste a
// URL directly. Either way the value handed to onChange is a URL. Videos
// (e.g. recorded sessions) go straight to object storage via a presigned
// URL, with progress; everything else goes through the API's /uploads
// endpoint (max 20 MB). `onUploadingChange` lets forms hold off saving
// until an upload finishes.
export default function FileOrUrlInput({ value, onChange, accept, kind = "file", label, onUploadingChange }) {
  const dispatch = useDispatch();
  const guard = useSelector((state) => state.auth.guard);
  const [mode, setMode] = useState("upload");
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const inputId = useId();
  const isLarge = kind === "video";
  const maxBytes = isLarge ? MAX_LARGE_UPLOAD_BYTES : MAX_SMALL_UPLOAD_BYTES;

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) {
      dispatch(
        pushToast({
          type: "error",
          message: `"${file.name}" is ${formatSize(file.size)} — the limit is ${formatSize(maxBytes)}.${
            isLarge ? " Try exporting the recording at a lower resolution." : ""
          }`,
        })
      );
      resetInput();
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    setProgress(isLarge ? 0 : null);
    try {
      const uploaded = isLarge ? await uploadLargeFile(guard, file, { onProgress: setProgress }) : await uploadFile(guard, file);
      setFileName(uploaded.name || file.name);
      onChange(uploaded.url);
    } catch (err) {
      dispatch(pushToast({ type: "error", message: err.message || "Upload failed." }));
      resetInput();
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      setProgress(null);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} className="hidden" id={inputId} />
          <label
            htmlFor={inputId}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:border-brand-500 hover:text-brand-700 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? (progress !== null ? `Uploading ${progress}%` : "Uploading...") : kind === "image" ? "Choose image" : kind === "document" ? "Choose document file" : "Choose video file"}
          </label>
          {(fileName || value) && (
            <span className="flex items-center gap-1 truncate rounded-lg bg-stone-100 px-2 py-1 text-[11px] text-stone-500">
              {fileName || "Uploaded"}
              <button type="button" onClick={clear} className="text-stone-400 hover:text-rose-600">
                <X size={11} />
              </button>
            </span>
          )}
          {uploading && progress !== null && (
            <div className="basis-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-stone-400">Keep this page open until the upload finishes.</p>
            </div>
          )}
          <p className="basis-full text-[10px] text-stone-400">Max {formatSize(maxBytes)}.</p>
        </div>
      ) : (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={kind === "image" ? "Paste an image URL" : kind === "document" ? "Document URL (PDF/Word link)" : "Video URL (mp4 link or Bunny Stream link)"}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-brand-600"
        />
      )}
    </div>
  );
}
