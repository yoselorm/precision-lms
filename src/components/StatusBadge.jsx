import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const STATUS_META = {
  completed: { label: "Completed", classes: "bg-emerald-50 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  "in-progress": { label: "In progress", classes: "bg-blue-50 text-blue-800 border-blue-200", Icon: Clock },
  "not-started": { label: "Not started", classes: "bg-stone-100 text-stone-600 border-stone-200", Icon: Circle },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META["not-started"];
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.classes}`}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

