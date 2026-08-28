import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { selectToasts, dismissToast } from "../store/slices/uiSlice";

const TYPE_META = {
  success: { Icon: CheckCircle2, classes: "border-emerald-200 bg-emerald-50 text-emerald-800", iconClass: "text-emerald-600" },
  error: { Icon: XCircle, classes: "border-rose-200 bg-rose-50 text-rose-800", iconClass: "text-rose-600" },
  info: { Icon: Info, classes: "border-stone-200 bg-white text-stone-700", iconClass: "text-stone-500" },
};

function Toast({ id, type, message }) {
  const dispatch = useDispatch();
  const meta = TYPE_META[type] || TYPE_META.info;
  const { Icon } = meta;
  // Local "leaving" state so the exit gets a transition instead of just
  // vanishing — dismissToast only fires once the fade/slide-out finishes.
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => setLeaving(true);

  useEffect(() => {
    const timer = setTimeout(dismiss, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dispatch(dismissToast(id)), 180);
    return () => clearTimeout(timer);
  }, [leaving, id, dispatch]);

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-200 ease-out ${
        leaving ? "translate-y-0 scale-95 opacity-0" : "animate-toast-in opacity-100"
      } ${meta.classes}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${meta.iconClass}`} />
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={dismiss} className="shrink-0 text-current opacity-50 transition hover:opacity-100">
        <X size={13} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector(selectToasts);
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-3 sm:left-auto sm:top-3">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full max-w-sm">
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
