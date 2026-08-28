import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UploadCloud, FileCheck2, ExternalLink, Lock } from "lucide-react";
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
  const existing = useSelector((state) => selectSubmissionForUser(state, type, refId, userId));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  };

  const handleSubmit = () => {
    if (!pendingFile) return;
    dispatch(
      addSubmission({
        type,
        refId,
        userId,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
        fileUrl: URL.createObjectURL(pendingFile),
      })
    );
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

      {disabled ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-400">
          <Lock size={13} className="shrink-0" /> Submissions are closed for this{" "}
          {type === "capstone" ? "capstone" : "assignment"}.
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
              disabled={!pendingFile}
              className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {existing ? "Resubmit" : "Submit"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-stone-400">Accepted formats: PDF, DOC, DOCX.</p>
        </>
      )}
    </div>
  );
}
