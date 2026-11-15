import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UploadCloud, FileCheck2, ExternalLink, Lock, Loader2 } from "lucide-react";
import { addSubmission, selectSubmissionForUser } from "../store/slices/submissionsSlice";
import { pushToast } from "../store/slices/uiSlice";

function formatSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

export default function SubmissionUpload({ type, refId, userId, disabled = false }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const existing = useSelector((state) => selectSubmissionForUser(state, type, refId, userId));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  };

  // Uploads the file to the assignment; resubmitting replaces the last one.
  const handleSubmit = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const result = await dispatch(addSubmission({ refId, userId, file: pendingFile }));
    setUploading(false);
    if (result.error) {
      dispatch(pushToast({ type: "error", message: result.payload || "Couldn't upload your submission." }));
      return;
    }
    dispatch(pushToast({ type: "success", message: `"${pendingFile.name}" submitted.` }));
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      {existing && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <FileCheck2 size={14} className="shrink-0" />
          <span className="flex-1 truncate">
            Submitted: <strong>{existing.fileName}</strong> ({formatSize(existing.fileSize)})
          </span>
          <a href={existing.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 text-emerald-700 hover:underline">
            <ExternalLink size={13} />
          </a>
        </div>
      )}
      {existing?.status === "graded" && (
        <div className="mb-3 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs">
          <p className="font-semibold text-stone-800">
            Grade: <span className="text-brand-700">{existing.grade}</span>
          </p>
          {existing.feedback && <p className="mt-1 whitespace-pre-line text-stone-600">{existing.feedback}</p>}
        </div>
      )}

      {disabled ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-400">
          <Lock size={13} className="shrink-0" /> Submissions are closed for this assignment.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="hidden" id={`submit-${type}-${refId}`} />
            <label
              htmlFor={`submit-${type}-${refId}`}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:border-brand-500 hover:text-brand-700"
            >
              <UploadCloud size={13} />
              {pendingFile ? pendingFile.name : "Choose PDF or Word file"}
            </label>
            <button
              onClick={handleSubmit}
              disabled={uploading || !pendingFile}
              className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading && <Loader2 size={13} className="animate-spin" />}
              {uploading ? "Uploading..." : existing ? "Resubmit" : "Submit"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-stone-400">Accepted formats: PDF, DOC, DOCX.</p>
        </>
      )}
    </div>
  );
}
