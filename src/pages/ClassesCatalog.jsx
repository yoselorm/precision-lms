import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarDays, Users, GraduationCap, Settings2 } from "lucide-react";
import Header from "../components/Header";
import { selectAllClasses } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  upcoming: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-stone-100 text-stone-500 border-stone-200",
};

export default function ClassesCatalog({ onMenuClick }) {
  const navigate = useNavigate();
  const classes = useSelector(selectAllClasses);
  const courses = useSelector(selectAllCourses);
  const users = useSelector(selectAllUsers);
  const currentUser = useSelector(selectCurrentUser);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Classes" subtitle="Scheduled cohorts run by a trainer, built on top of a course." onMenuClick={onMenuClick} />

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
        {classes.map((cls) => {
          const course = courses.find((c) => c.id === cls.courseId);
          const trainer = users.find((u) => u.id === cls.trainerId);
          const members = users.filter((u) => cls.memberIds.includes(u.id));
          const isMember = cls.memberIds.includes(currentUser.id);

          return (
            <div
              key={cls.id}
              onClick={() => navigate(`/classes/${cls.id}`)}
              className={`cursor-pointer rounded-2xl border bg-white p-5 transition hover:shadow-md ${
                isMember ? "border-brand-400 ring-1 ring-brand-100" : "border-stone-200"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[cls.status]}`}>
                  {cls.status}
                </span>
                {isMember && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">You're enrolled</span>
                )}
              </div>

              <h3 className="text-sm font-bold text-stone-900 leading-snug">{cls.title}</h3>
              <p className="mt-0.5 text-xs text-stone-500">{course?.title}</p>

              <div className="mt-3 space-y-1.5 text-xs text-stone-500">
                <p className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {new Date(cls.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} —{" "}
                  {new Date(cls.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <p className="flex items-center gap-1.5">
                  <GraduationCap size={12} /> Trainer: {trainer?.name ?? "Unassigned"}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users size={12} /> {members.length} learners
                </p>
              </div>

              <div className="mt-3 flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <img key={m.id} src={m.avatarUrl} alt={m.name} title={m.name} className="h-7 w-7 rounded-full border-2 border-white object-cover" />
                ))}
                {members.length > 5 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-[10px] font-bold text-stone-500">
                    +{members.length - 5}
                  </span>
                )}
              </div>

              {(currentUser.role === "admin" || currentUser.id === cls.trainerId) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/classes/${cls.id}/manage`);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Settings2 size={13} /> Manage materials
                </button>
              )}
            </div>
          );
        })}

        {classes.length === 0 && <p className="text-sm text-stone-400">No classes scheduled yet.</p>}
      </div>
    </div>
  );
}
