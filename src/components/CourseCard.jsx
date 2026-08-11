import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Layers } from "lucide-react";
import CircularProgress from "./CircularProgress";
import StatusBadge from "./StatusBadge";

export default function CourseCard({ course, enrollment }) {
  const navigate = useNavigate();
  const progress = enrollment?.progress ?? 0;
  const status = enrollment?.status ?? "not-started";
  const ringColor = progress === 100 ? "#16a34a" : progress > 0 ? "#2563eb" : "#d6d3d1";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:shadow-md">
      <div className="relative h-28">
        <img src={course.thumbnailImage} alt={course.title} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              {course.category}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                course.price > 0 ? "bg-violet-500 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              {course.price > 0 ? `GH₵${course.price}` : "Free"}
            </span>
          </div>
          {course.mandatory && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-amber-950">Mandatory</span>
          )}
        </div>
        <div className="absolute -bottom-5 left-3 rounded-full bg-white p-0.5 shadow-md">
          <CircularProgress value={progress} size={42} strokeWidth={4} color={ringColor} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-7">
        <h3 className="text-sm font-bold leading-snug text-stone-900 line-clamp-2">{course.title}</h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
          <span className="flex items-center gap-1">
            <Layers size={11} /> {course.modules.length} Topics
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} /> +{course.studentsCount} Students
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {course.durationMins} min
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <StatusBadge status={status} />
          <button
            onClick={() => navigate(`/course/${course.id}`)}
            className="rounded-lg bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-800"
          >
            {status === "not-started"
              ? course.price > 0
                ? `Enroll — GH₵${course.price}`
                : "Enroll now"
              : status === "completed"
              ? "Review"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
