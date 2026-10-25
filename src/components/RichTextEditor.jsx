import React, { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Heading2, List, ListOrdered, Quote, Link2, RemoveFormatting } from "lucide-react";
import { sanitizeHtml, looksLikeHtml } from "../utils/richText";

const TOOLS = [
  { icon: Bold, title: "Bold", command: "bold" },
  { icon: Italic, title: "Italic", command: "italic" },
  { icon: Underline, title: "Underline", command: "underline" },
  { icon: Heading2, title: "Heading", command: "formatBlock", value: "H3", divider: true },
  { icon: Quote, title: "Quote", command: "formatBlock", value: "BLOCKQUOTE" },
  { icon: List, title: "Bulleted list", command: "insertUnorderedList", divider: true },
  { icon: ListOrdered, title: "Numbered list", command: "insertOrderedList" },
  { icon: Link2, title: "Link", command: "createLink", divider: true },
  { icon: RemoveFormatting, title: "Clear formatting", command: "removeFormat" },
];

// Small rich-text editor (bold, italic, underline, headings, quotes, lists,
// links). Outputs sanitized HTML through onChange. The editable area is
// left uncontrolled after mount so the caret doesn't jump while typing.
export default function RichTextEditor({ value, onChange, placeholder, invalid = false, minHeight = 140 }) {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const [empty, setEmpty] = useState(!value);
  const [linkUrl, setLinkUrl] = useState(null); // null = link field closed

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = looksLikeHtml(value) ? sanitizeHtml(value) : (value || "").replace(/\n/g, "<br>");
    }
    // Only seed the initial content; later edits flow out via onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    const html = editorRef.current.innerHTML;
    setEmpty(!editorRef.current.textContent.trim());
    onChange(sanitizeHtml(html));
  };

  const run = (tool) => {
    if (tool.command === "createLink") {
      // Remember the selected text so the link can be applied to it after
      // the URL field takes focus.
      const sel = window.getSelection();
      savedRange.current = sel.rangeCount && editorRef.current.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
      setLinkUrl("");
      return;
    }
    editorRef.current.focus();
    document.execCommand(tool.command, false, tool.value);
    emit();
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    setLinkUrl(null);
    if (!url) return;
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    if (sel.isCollapsed) document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${href}</a>`);
    else document.execCommand("createLink", false, href);
    emit();
  };

  return (
    <div className={`overflow-hidden rounded-lg border bg-white focus-within:border-brand-600 ${invalid ? "border-rose-400" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 bg-stone-50 px-1.5 py-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <React.Fragment key={tool.title}>
              {tool.divider && <span className="mx-1 h-4 w-px bg-stone-200" />}
              <button
                type="button"
                title={tool.title}
                // Keep the selection in the editor when the toolbar is clicked.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(tool)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-white hover:text-stone-900"
              >
                <Icon size={14} />
              </button>
            </React.Fragment>
          );
        })}
      </div>
      {linkUrl !== null && (
        <div className="flex items-center gap-2 border-b border-stone-100 bg-brand-50/50 px-2 py-1.5">
          <Link2 size={13} className="shrink-0 text-brand-700" />
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkUrl(null);
            }}
            placeholder="Paste a link, e.g. https://afenet.net"
            className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-600"
          />
          <button type="button" onClick={applyLink} className="rounded-md bg-brand-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-800">
            Add link
          </button>
          <button type="button" onClick={() => setLinkUrl(null)} className="text-[11px] font-semibold text-stone-500 hover:text-stone-800">
            Cancel
          </button>
        </div>
      )}
      <div className="relative">
        {empty && placeholder && <p className="pointer-events-none absolute left-3.5 top-3 text-sm text-stone-400">{placeholder}</p>}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          style={{ minHeight }}
          className="rich-text max-h-80 overflow-y-auto px-3.5 py-3 text-sm text-stone-800 outline-none"
        />
      </div>
    </div>
  );
}

// Read-only rendering of stored rich text. Older plain-text descriptions
// still display with their line breaks.
export function RichText({ html, className = "" }) {
  if (!looksLikeHtml(html)) {
    return <p className={`whitespace-pre-line ${className}`}>{html}</p>;
  }
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}
