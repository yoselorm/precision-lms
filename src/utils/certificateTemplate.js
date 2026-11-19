// Certificate templates are a fixed-size page (A4 landscape proportions)
// holding positioned elements. Positions and widths are percentages of the
// page so a template renders the same at any display size; font sizes are in
// page pixels and scale with the page.
import afenetLogo from "../assets/images/afenet-logo.jpeg";

export const PAGE_WIDTH = 1100;
export const PAGE_HEIGHT = 778;

// Templates built on an uploaded design take that design's proportions
// (stored on the background, since that's what the API keeps as JSON);
// everything else uses the standard landscape page. The long side stays
// PAGE_WIDTH so font sizes mean the same thing on every template.
export function getPageSize(template) {
  const bg = template?.background || {};
  return bg.pageWidth && bg.pageHeight ? { width: bg.pageWidth, height: bg.pageHeight } : { width: PAGE_WIDTH, height: PAGE_HEIGHT };
}

// Standard page in either orientation (uploaded templates set their own).
export const PORTRAIT_PAGE = { pageWidth: PAGE_HEIGHT, pageHeight: PAGE_WIDTH };
export const orientationOf = (template) => {
  const { width, height } = getPageSize(template);
  return height > width ? "portrait" : "landscape";
};

export function pageSizeFor(imageWidth, imageHeight) {
  const ratio = imageHeight / imageWidth;
  return ratio <= 1
    ? { pageWidth: PAGE_WIDTH, pageHeight: Math.round(PAGE_WIDTH * ratio) }
    : { pageWidth: Math.round(PAGE_WIDTH / ratio), pageHeight: PAGE_WIDTH };
}

// Dynamic values filled in per learner when a certificate is shown.
export const PLACEHOLDERS = [
  { token: "{{learner_name}}", label: "Learner name" },
  { token: "{{course_title}}", label: "Course title" },
  { token: "{{completion_date}}", label: "Completion date" },
  { token: "{{certificate_title}}", label: "Certificate title" },
  { token: "{{issuer}}", label: "Issued by" },
];

// Built-in images are stored by name, not by bundled URL, because the bundled
// file name changes between builds while saved templates persist.
const BUILTIN_IMAGES = { "builtin:afenet-logo": afenetLogo };
export const resolveImageSrc = (src) => BUILTIN_IMAGES[src] || src;

export const FONT_FAMILIES = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  script: '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive',
};

let counter = 0;
export const newElementId = () => `el-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function textElement(overrides = {}) {
  return {
    id: newElementId(),
    type: "text",
    text: "New text",
    x: 50,
    y: 50,
    width: 60,
    fontSize: 22,
    fontFamily: "sans",
    bold: false,
    italic: false,
    color: "#1c1917",
    align: "center",
    ...overrides,
  };
}

export function imageElement(src, overrides = {}) {
  return { id: newElementId(), type: "image", src, x: 50, y: 50, width: 18, ...overrides };
}

// A plain rectangle — used to cover text that's printed on an uploaded
// template (e.g. a sample name) so a field can sit on top. Height is a
// percentage of the page height, like width is of the page width.
export function boxElement(overrides = {}) {
  return { id: newElementId(), type: "box", color: "#ffffff", x: 50, y: 50, width: 30, height: 8, ...overrides };
}

export function signatureElement(overrides = {}) {
  return {
    id: newElementId(),
    type: "signature",
    src: "",
    name: "Signatory name",
    title: "Signatory title",
    x: 50,
    y: 82,
    width: 24,
    ...overrides,
  };
}

// Layout used for certificates that haven't been customised yet — built
// from the certificate's basic fields so older certificates keep working.
// Portrait stacks the same content down a taller, narrower page.
export function defaultTemplate(certificate = {}, orientation = "landscape") {
  if (orientation === "portrait") return portraitTemplate(certificate);
  const elements = [
    imageElement("builtin:afenet-logo", { x: 50, y: 13, width: 20 }),
    textElement({ text: "{{certificate_title}}", y: 27, width: 80, fontSize: 15, bold: true, color: "#78716c" }),
    textElement({ text: "This is to certify that", y: 37, fontSize: 18, color: "#57534e", fontFamily: "serif", italic: true }),
    textElement({ text: "{{learner_name}}", y: 47, width: 80, fontSize: 46, bold: true, color: "#17295D", fontFamily: "serif" }),
    textElement({ text: "has successfully completed", y: 57, fontSize: 18, color: "#57534e", fontFamily: "serif", italic: true }),
    textElement({ text: "{{course_title}}", y: 65, width: 80, fontSize: 28, bold: true, color: "#21409A" }),
    textElement({ text: "Issued {{completion_date}}", y: 73, fontSize: 14, color: "#78716c" }),
    textElement({ text: "{{issuer}}", x: 78, y: 86, width: 28, fontSize: 15, bold: true, color: "#44403c" }),
    textElement({ text: "Issued by", x: 78, y: 90, width: 28, fontSize: 12, color: "#a8a29e" }),
  ];
  if (certificate.signatoryName) {
    elements.push(
      signatureElement({ x: 22, y: 86, name: certificate.signatoryName, title: certificate.signatoryTitle || "Signatory" })
    );
  }
  return {
    background: { color: "#ffffff", image: "", border: true, borderColor: "#21409A" },
    elements,
  };
}

function portraitTemplate(certificate) {
  const elements = [
    imageElement("builtin:afenet-logo", { x: 50, y: 11, width: 32 }),
    textElement({ text: "{{certificate_title}}", y: 23, width: 84, fontSize: 15, bold: true, color: "#78716c" }),
    textElement({ text: "This is to certify that", y: 33, width: 84, fontSize: 18, color: "#57534e", fontFamily: "serif", italic: true }),
    textElement({ text: "{{learner_name}}", y: 42, width: 86, fontSize: 40, bold: true, color: "#17295D", fontFamily: "serif" }),
    textElement({ text: "has successfully completed", y: 51, width: 84, fontSize: 18, color: "#57534e", fontFamily: "serif", italic: true }),
    textElement({ text: "{{course_title}}", y: 59, width: 84, fontSize: 26, bold: true, color: "#21409A" }),
    textElement({ text: "Issued {{completion_date}}", y: 67, width: 84, fontSize: 14, color: "#78716c" }),
    textElement({ text: "{{issuer}}", x: 70, y: 86, width: 40, fontSize: 15, bold: true, color: "#44403c" }),
    textElement({ text: "Issued by", x: 70, y: 89, width: 40, fontSize: 12, color: "#a8a29e" }),
  ];
  if (certificate.signatoryName) {
    elements.push(
      signatureElement({ x: 30, y: 86, width: 36, name: certificate.signatoryName, title: certificate.signatoryTitle || "Signatory" })
    );
  }
  return {
    background: { color: "#ffffff", image: "", border: true, borderColor: "#21409A", ...PORTRAIT_PAGE },
    elements,
  };
}

export const getTemplate = (certificate) => certificate?.template || defaultTemplate(certificate);

export function fillPlaceholders(text, data) {
  return (text || "")
    .replaceAll("{{learner_name}}", data.learnerName ?? "")
    .replaceAll("{{course_title}}", data.courseTitle ?? "")
    .replaceAll("{{completion_date}}", data.completionDate ?? "")
    .replaceAll("{{certificate_title}}", data.certificateTitle ?? "")
    .replaceAll("{{issuer}}", data.issuer ?? "");
}

export const formatCertificateDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

// Uploaded images are kept as data URLs in the (localStorage-persisted)
// store, so they're downscaled first to keep the saved state small.
export function readImageFile(file, { maxWidth = 900, keepTransparency = false } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(keepTransparency ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
