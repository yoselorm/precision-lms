import React from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";

export default function ContinueWatching({ items }) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">Continue watching</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map(({ course, enrollment }) => (
          <button
            key={course.id}
            onClick={() => navigate(`/course/${course.id}`)}
            className="group text-left"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={course.thumbnailImage}
                alt={course.title}
                className="h-28 w-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                <PlayCircle size={32} className="text-white" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/40">
                <div className="h-1 bg-brand-500" style={{ width: `${enrollment.progress}%` }} />
              </div>
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-stone-800">{course.title}</p>
            <p className="text-[11px] text-stone-400">{enrollment.progress}% complete</p>
          </button>
        ))}
      </div>
    </div>
  );
}
