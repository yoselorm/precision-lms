import React, { forwardRef, useEffect, useRef, useState } from "react";
import { PAGE_WIDTH, PAGE_HEIGHT, FONT_FAMILIES, fillPlaceholders, resolveImageSrc } from "../utils/certificateTemplate";

function ElementView({ element, data }) {
  if (element.type === "text") {
    return (
      <div
        style={{
          fontSize: element.fontSize,
          fontFamily: FONT_FAMILIES[element.fontFamily] || FONT_FAMILIES.sans,
          fontWeight: element.bold ? 700 : 400,
          fontStyle: element.italic ? "italic" : "normal",
          color: element.color,
          textAlign: element.align,
          lineHeight: 1.25,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      >
        {fillPlaceholders(element.text, data) || " "}
      </div>
    );
  }
  if (element.type === "image") {
    return <img src={resolveImageSrc(element.src)} alt="" draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />;
  }
  // Signature: optional signature image over a line, then name and title.
  return (
    <div style={{ textAlign: "center", fontFamily: FONT_FAMILIES.sans }}>
      <div style={{ height: 64, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {element.src ? (
          <img src={element.src} alt="" draggable={false} style={{ maxHeight: 64, maxWidth: "100%", objectFit: "contain" }} />
        ) : null}
      </div>
      <div style={{ borderTop: "1.5px solid #44403c", marginTop: 4, paddingTop: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#292524" }}>{element.name}</div>
        <div style={{ fontSize: 12, color: "#78716c" }}>{element.title}</div>
      </div>
    </div>
  );
}

// The certificate page at its true size (PAGE_WIDTH × PAGE_HEIGHT). Used
// directly for downloads, and scaled down by CertificateCanvas for display.
export const CertificatePage = forwardRef(function CertificatePage(
  { template, data, editable = false, selectedId, onElementPointerDown, onBackgroundPointerDown },
  ref
) {
  const { background = {}, elements = [] } = template;
  return (
    <div
      ref={ref}
      onPointerDown={editable ? onBackgroundPointerDown : undefined}
      style={{
        position: "relative",
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        overflow: "hidden",
        backgroundColor: background.color || "#ffffff",
        backgroundImage: background.image ? `url(${background.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        userSelect: "none",
      }}
    >
      {background.border && (
        <>
          <div style={{ position: "absolute", inset: 18, border: `4px solid ${background.borderColor || "#21409A"}`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 28, border: `1px solid ${background.borderColor || "#21409A"}`, opacity: 0.5, pointerEvents: "none" }} />
        </>
      )}
      {elements.map((el) => {
        const selected = editable && el.id === selectedId;
        return (
          <div
            key={el.id}
            onPointerDown={editable ? (e) => onElementPointerDown?.(e, el) : undefined}
            style={{
              position: "absolute",
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              transform: "translate(-50%, -50%)",
              cursor: editable ? "move" : undefined,
              outline: selected ? "2px dashed #21409A" : editable ? "1px dashed transparent" : undefined,
              outlineOffset: 4,
            }}
          >
            <ElementView element={el} data={data} />
          </div>
        );
      })}
    </div>
  );
});

// Responsive wrapper: scales the page to fit its container's width. When
// `editable`, elements can be selected and dragged; moves are reported as
// percentage positions through onMoveElement.
export default function CertificateCanvas({ template, data, editable = false, selectedId, onSelect, onMoveElement }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const dragRef = useRef(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const update = () => setScale(node.clientWidth / PAGE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!editable) return;
    const handleMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = ((e.clientX - drag.startX) / (PAGE_WIDTH * scale)) * 100;
      const dy = ((e.clientY - drag.startY) / (PAGE_HEIGHT * scale)) * 100;
      const clamp = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
      onMoveElement?.(drag.id, { x: clamp(drag.originX + dx), y: clamp(drag.originY + dy) });
    };
    const handleUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [editable, scale, onMoveElement]);

  const handleElementPointerDown = (e, el) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(el.id);
    dragRef.current = { id: el.id, startX: e.clientX, startY: e.clientY, originX: el.x, originY: el.y };
  };

  return (
    <div ref={wrapperRef} className="w-full" style={{ height: PAGE_HEIGHT * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
        <CertificatePage
          template={template}
          data={data}
          editable={editable}
          selectedId={selectedId}
          onElementPointerDown={handleElementPointerDown}
          onBackgroundPointerDown={() => onSelect?.(null)}
        />
      </div>
    </div>
  );
}
