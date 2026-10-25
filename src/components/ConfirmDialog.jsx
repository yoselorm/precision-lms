import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import ModalOverlay from "./ModalOverlay";

const ConfirmContext = createContext(null);

// App-wide replacement for window.confirm: `const confirm = useConfirm()`,
// then `if (await confirm({ title, message, confirmLabel, tone })) ...`.
// tone "danger" styles the confirm button for destructive actions.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setRequest(options);
      }),
    []
  );

  const close = (result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && <ConfirmModal {...request} onCancel={() => close(false)} onConfirm={() => close(true)} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

function ConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default", onCancel, onConfirm }) {
  const confirmRef = useRef(null);
  const danger = tone === "danger";

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <ModalOverlay layer="z-[60]" onBackdropClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-xl">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${danger ? "bg-rose-50" : "bg-brand-50"}`}>
          {danger ? <AlertTriangle size={20} className="text-rose-600" /> : <HelpCircle size={20} className="text-brand-700" />}
        </div>
        <h2 id="confirm-title" className="text-base font-bold text-stone-900">
          {title}
        </h2>
        {message && <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-700 hover:bg-brand-800"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
