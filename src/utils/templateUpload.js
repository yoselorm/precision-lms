import { uploadFile } from "../api/client";
import { pageSizeFor } from "./certificateTemplate";

// Turns an uploaded certificate design (an image, or the first page of a
// PDF) into a full-quality background image in storage, plus the page size
// matching its proportions.

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // /uploads limit
const RENDER_LONG_SIDE = 3000; // print quality for the rendered PDF page

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

// High-quality JPEG: a full-page design as PNG runs to several MB and is
// slow to show everywhere the certificate appears; JPEG stays crisp at a
// fraction of the size.
const encode = async (canvas) => ({ blob: await canvasToBlob(canvas, "image/jpeg", 0.9), ext: "jpg" });

async function renderPdfFirstPage(file) {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerSrc } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: RENDER_LONG_SIDE / Math.max(base.width, base.height) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const { blob, ext } = await encode(canvas);
  return { blob, ext, width: canvas.width, height: canvas.height, pageCount: pdf.numPages };
}

async function readImage(file) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  if (file.size <= MAX_UPLOAD_BYTES) {
    bitmap.close();
    return { blob: file, ext: null, width, height, pageCount: 1 };
  }
  // Too big to upload as-is: scale down to print quality.
  const scale = Math.min(1, RENDER_LONG_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const { blob, ext } = await encode(canvas);
  return { blob, ext, width: canvas.width, height: canvas.height, pageCount: 1 };
}

export const isPdf = (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

// Resolves to { image, pageWidth, pageHeight, pageCount }.
export async function uploadCertificateTemplate(guard, file) {
  const prepared = isPdf(file) ? await renderPdfFirstPage(file) : await readImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "certificate-template";
  const upload = prepared.ext ? new File([prepared.blob], `${baseName}.${prepared.ext}`, { type: prepared.blob.type }) : file;
  const { url } = await uploadFile(guard, upload);
  return { image: url, ...pageSizeFor(prepared.width, prepared.height), pageCount: prepared.pageCount };
}
