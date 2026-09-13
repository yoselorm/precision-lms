import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, GraduationCap, Users, Settings2 } from "lucide-react";
import Header from "../components/Header";
import ClassFormModal from "../components/ClassFormModal";
import { selectAllClasses } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";

export default function AdminClasses({ onMenuClick }) {
  const navigate = useNavigate();
  const classes = useSelector(selectAllClasses);
  const courses = useSelector(selectAllCourses);
  const users = useSelector(selectAllUsers);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Classes" subtitle={`${classes.length} scheduled cohorts`} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Add class
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const classCourses = (cls.courses || []).map((cc) => courses.find((c) => c.id === cc.courseId)).filter(Boolean);
            const courseSummary =
              classCourses.length === 0
                ? "No courses attached"
                : classCourses.length === 1
                ? classCourses[0].title
                : `${classCourses[0].title} +${classCourses.length - 1} more`;
            const trainer = users.find((u) => u.id === cls.trainerId);
            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/classes/${cls.id}`)}
                className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-stone-900">{cls.title}</h3>
                <p className="mt-0.5 text-xs text-stone-500">{courseSummary}</p>
                <div className="mt-3 space-y-1.5 text-xs text-stone-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays size={12} /> {cls.startDate} — {cls.endDate}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={12} /> {trainer?.name ?? "Unassigned"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={12} /> {cls.memberIds.length} students
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/classes/${cls.id}/manage`);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Settings2 size={13} /> Manage materials
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && <ClassFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
