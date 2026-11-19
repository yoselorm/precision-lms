import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileUp, Loader2 } from "lucide-react";
import { pushToast } from "../store/slices/uiSlice";
import { uploadCertificateTemplate } from "../utils/templateUpload";

// Uploads the client's own design (image, or a PDF's first page) to use as
// the whole certificate page. Used by the designer and the "create
// certificate" form.
export default function TemplateUploadButton({ label, onUploaded, className }) {
  const dispatch = useDispatch();
  const guard = useSelector((state) => state.auth.guard);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    setBusy(true);
    try {
      const result = await uploadCertificateTemplate(guard, file);
      onUploaded(result);
      if (result.pageCount > 1) {
        dispatch(
          pushToast({
            type: "info",
            message: `Your PDF has ${result.pageCount} pages — only the first page is used for the certificate.`,
          })
        );
      }
    } catch (err) {
      dispatch(pushToast({ type: "error", message: err.message || "Couldn't use that file as a template." }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={className}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />} {busy ? "Preparing template..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </>
  );
}
