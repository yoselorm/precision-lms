import React, { useRef, useState } from "react";
import { Download, FileDown, Loader2, X } from "lucide-react";
import CertificateCanvas, { CertificatePage } from "./CertificateCanvas";
import ModalOverlay from "./ModalOverlay";
import { PAGE_WIDTH, PAGE_HEIGHT, getTemplate, formatCertificateDate } from "../utils/certificateTemplate";

// Shows a course's certificate filled in for one learner, with PNG and PDF
// downloads. Downloads are rendered from a full-size copy of the page kept
// off-screen, so they come out at print quality regardless of screen size.
export default function CertificateView({ certificate, learnerName, courseTitle, completedAt, onClose }) {
  const exportRef = useRef(null);
  const [busy, setBusy] = useState(null);

  const template = getTemplate(certificate);
  const data = {
    learnerName,
    courseTitle,
    completionDate: formatCertificateDate(completedAt),
    certificateTitle: certificate.title,
    issuer: certificate.issuer,
  };
  const fileName = `${courseTitle} - ${learnerName}`.replace(/[^\w\- ]+/g, "").trim() || "certificate";

  const download = async (format) => {
    setBusy(format);
    try {
      const { toPng, toJpeg } = await import("html-to-image");
      const options = { pixelRatio: 2, width: PAGE_WIDTH, height: PAGE_HEIGHT };
      if (format === "png") {
        const link = document.createElement("a");
        link.href = await toPng(exportRef.current, options);
        link.download = `${fileName}.png`;
        link.click();
      } else {
        // JPEG keeps the PDF small; jsPDF embeds PNGs uncompressed.
        const jpeg = await toJpeg(exportRef.current, { ...options, quality: 0.92, backgroundColor: "#ffffff" });
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [PAGE_WIDTH, PAGE_HEIGHT], hotfixes: ["px_scaling"] });
        pdf.addImage(jpeg, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        pdf.save(`${fileName}.pdf`);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <ModalOverlay tint="bg-stone-950/75">
      <div className="w-full max-w-4xl animate-scale-in">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => download("png")}
            disabled={!!busy}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/25 disabled:opacity-60"
          >
            {busy === "png" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PNG
          </button>
          <button
            onClick={() => download("pdf")}
            disabled={!!busy}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
          >
            {busy === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Download PDF
          </button>
          <button onClick={onClose} className="ml-1 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-hidden rounded-xl shadow-2xl">
          <CertificateCanvas template={template} data={data} />
        </div>
      </div>

      <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0 }}>
        <CertificatePage ref={exportRef} template={template} data={data} />
      </div>
    </ModalOverlay>
  );
}
