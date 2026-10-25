// Course descriptions are written in a small rich-text editor and stored as
// HTML. Everything is passed through this allow-list before it's rendered,
// so only basic formatting tags (and http/https/mailto links) survive.
const ALLOWED_TAGS = new Set(["P", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "H3", "H4", "A", "BLOCKQUOTE"]);
const RENAME_TAGS = { DIV: "P" };

export function sanitizeHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;

  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }
      clean(child);
      const tag = RENAME_TAGS[child.tagName] || child.tagName;
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      const replacement = doc.createElement(tag);
      if (tag === "A") {
        const href = child.getAttribute("href") || "";
        if (/^(https?:|mailto:)/i.test(href)) {
          replacement.setAttribute("href", href);
          replacement.setAttribute("target", "_blank");
          replacement.setAttribute("rel", "noopener noreferrer");
        }
      }
      replacement.append(...child.childNodes);
      child.replaceWith(replacement);
    });
  };
  clean(root);
  return root.innerHTML;
}

// Plain text from stored HTML — for "is it empty?" checks and short previews.
export function htmlToText(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value || "");
