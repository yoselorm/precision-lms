import React from "react";
import { createPortal } from "react-dom";

// Full-screen backdrop shared by every modal. Rendered into <body> via a
// portal so no page layout (overflow, stacking, transforms) can clip it or
// sit above it — it always covers the sidebar and header too. Toasts
// (z-[100]) still show on top.
export default function ModalOverlay({ children, layer = "z-50", tint = "bg-stone-950/55", onBackdropClick }) {
  return createPortal(
    <div
      className={`fixed inset-0 ${layer} flex animate-backdrop-in items-center justify-center ${tint} p-4 backdrop-blur-[2px]`}
      onMouseDown={onBackdropClick ? (e) => e.target === e.currentTarget && onBackdropClick() : undefined}
    >
      {children}
    </div>,
    document.body
  );
}
