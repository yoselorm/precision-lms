import React, { useState } from "react";
import { Star } from "lucide-react";

// Five stars filled to `value` (0–5, fractions allowed).
export function StarRating({ value = 0, size = 14, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-stone-300" strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// "★ 4.5 (12)" — or nothing when a course has no ratings yet.
export function RatingSummary({ average, count, size = 12, className = "" }) {
  if (!count || average == null) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Star size={size} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-stone-700">{Number(average).toFixed(1)}</span>
      <span className="text-stone-400">({count})</span>
    </span>
  );
}

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// Clickable 1–5 stars for leaving a rating.
export function StarInput({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition hover:scale-110"
          >
            <Star size={size} className={n <= shown ? "fill-amber-400 text-amber-400" : "text-stone-300"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      {shown > 0 && <span className="text-xs font-semibold text-stone-500">{LABELS[shown]}</span>}
    </div>
  );
}
