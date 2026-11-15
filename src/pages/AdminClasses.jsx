import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CalendarDays, GraduationCap, Users, Eye } from "lucide-react";
import Header from "../components/Header";
import { selectAllClasses, selectClassesStatus } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { usePageData } from "../hooks/usePageData";
import { loadClasses } from "../store/loadAppData";

// Classes are created and run by trainers — admins oversee them here.
export default function AdminClasses({ onMenuClick }) {
  usePageData(loadClasses);
  const navigate = useNavigate();
  const classes = useSelector(selectAllClasses);
  const status = useSelector(selectClassesStatus);
  const courses = useSelector(selectAllCourses);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Classes" subtitle={`${classes.length} scheduled cohort${classes.length === 1 ? "" : "s"}`} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <p className="text-xs text-stone-400">Trainers create classes from their Classes page.</p>

        {classes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
            {status === "loading" ? "Loading classes..." : "No classes yet."}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const classCourses = (cls.courses || []).map((cc) => courses.find((c) => c.id === cc.courseId)).filter(Boolean);
            // The list response doesn't include courses — only the detail does.
            const courseSummary = !cls.courses
              ? "Open the class to see its courses"
              : classCourses.length === 0
                ? "No courses attached"
                : classCourses.length === 1
                ? classCourses[0].title
                : `${classCourses[0].title} +${classCourses.length - 1} more`;
            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/classes/${cls.id}`)}
                className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-stone-900">{cls.title}</h3>
                {cls.description && <p className="mt-1 line-clamp-2 text-xs text-stone-500">{cls.description}</p>}
                <p className="mt-0.5 text-xs text-stone-500">{courseSummary}</p>
                <div className="mt-3 space-y-1.5 text-xs text-stone-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={12} /> {cls.trainerName ?? "Unassigned"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={12} /> {cls.memberCount} student{cls.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/classes/${cls.id}/manage`);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Eye size={13} /> View materials
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
