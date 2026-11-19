import React, { useRef, useState } from "react";
import { Download, FileDown, Loader2, X } from "lucide-react";
import CertificateCanvas, { CertificatePage } from "./CertificateCanvas";
import ModalOverlay from "./ModalOverlay";
import { getPageSize, getTemplate, formatCertificateDate, resolveImageSrc } from "../utils/certificateTemplate";

// Downloads redraw the page into an image, and that step can't reliably load
// images from storage/CDN URLs itself — so fetch them here and inline them as
// data URLs on the copy of the template being exported.
async function toDataUrl(src) {
  if (!src || src.startsWith("data:")) return src;
  const res = await fetch(src, { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`Couldn't load ${src}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function inlineImages(template) {
  const image = template.background?.image ? await toDataUrl(template.background.image) : template.background?.image;
  const elements = await Promise.all(
    (template.elements || []).map(async (el) => (el.src ? { ...el, src: await toDataUrl(resolveImageSrc(el.src)) } : el))
  );
  return { ...template, background: { ...template.background, image }, elements };
}

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// Shows a course's certificate filled in for one learner, with PNG and PDF
// downloads. Downloads are rendered from a full-size copy of the page kept
// off-screen, so they come out at print quality regardless of screen size.
export default function CertificateView({ certificate, learnerName, courseTitle, completedAt, onClose }) {
  const exportRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const template = getTemplate(certificate);
  // What the off-screen export copy renders — swapped for an inlined version
  // just before each download.
  const [exportTemplate, setExportTemplate] = useState(template);
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
    setError("");
    try {
      setExportTemplate(await inlineImages(template));
      await nextPaint();
      const { toPng, toJpeg } = await import("html-to-image");
      const { width, height } = getPageSize(template);
      const options = { pixelRatio: 2, width, height };
      if (format === "png") {
        const link = document.createElement("a");
        link.href = await toPng(exportRef.current, options);
        link.download = `${fileName}.png`;
        link.click();
      } else {
        // JPEG keeps the PDF small; jsPDF embeds PNGs uncompressed.
        const jpeg = await toJpeg(exportRef.current, { ...options, quality: 0.92, backgroundColor: "#ffffff" });
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: width >= height ? "landscape" : "portrait", unit: "px", format: [width, height], hotfixes: ["px_scaling"] });
        pdf.addImage(jpeg, "JPEG", 0, 0, width, height);
        pdf.save(`${fileName}.pdf`);
      }
    } catch {
      setError("Couldn't prepare the download — check your connection and try again.");
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
        {error && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
        <CertificateCanvas template={template} data={data} maxHeight="calc(100vh - 7rem)" className="overflow-hidden rounded-xl shadow-2xl" />
      </div>

      <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0 }}>
        <CertificatePage ref={exportRef} template={exportTemplate} data={data} />
      </div>
    </ModalOverlay>
  );
}
