import React from "react";

export default function ProgressBar({ value, colorClass = "bg-brand-600", heightClass = "h-2" }) {
  return (
    <div className={`w-full rounded-full bg-stone-100 ${heightClass}`}>
      <div
        className={`${heightClass} rounded-full ${colorClass} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
