import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, BookOpen, FileCheck2, Settings2, CalendarDays, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectClassesByTrainer } from "../store/slices/classesSlice";
import { selectCoursesByCreator } from "../store/slices/coursesSlice";
import { selectDashboardStats } from "../store/slices/dashboardSlice";

const STATUS_PILL = {
  draft: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  denied: "border-stone-200 bg-stone-100 text-stone-500",
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-lg font-bold text-stone-900 leading-tight">{value}</p>
        <p className="text-[11px] text-stone-500">{label}</p>
      </div>
    </div>
  );
}

// Totals come from the trainer summary at GET /user/dashboard; the class
// and course lists from the loaded data.
export default function TrainerDashboard({ onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const stats = useSelector(selectDashboardStats);
  const classes = useSelector((state) => selectClassesByTrainer(state, currentUser.id));
  const myCourses = useSelector((state) => selectCoursesByCreator(state, currentUser.id));
  const courses = useSelector((state) => state.courses.courses);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={`Welcome back, ${currentUser.name.split(" ")[0]}`} subtitle="Here's how your classes are progressing." showSearch onMenuClick={onMenuClick} />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={CalendarDays} label="Classes" value={stats?.my_classes?.total ?? classes.length} accent="#7c3aed" />
          <StatCard icon={Users} label="Total learners" value={stats?.total_students ?? 0} accent="#2563eb" />
          <StatCard icon={BookOpen} label="Live courses" value={stats?.my_courses?.approved ?? 0} accent="#16a34a" />
          <StatCard icon={FileCheck2} label="Submissions to grade" value={stats?.submissions_pending_grading ?? 0} accent="#ea580c" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-bold text-stone-800">Your classes</h2>
            {classes.map((cls) => {
              const classCourses = (cls.courses || []).map((cc) => courses.find((c) => c.id === cc.courseId)).filter(Boolean);
              return (
                <div key={cls.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {classCourses[0] && <img src={classCourses[0].thumbnailImage} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-stone-900">{cls.title}</h3>
                          <p className="truncate text-xs text-stone-500">
                            {cls.startDate} — {cls.endDate} · {cls.memberCount} learner{cls.memberCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                            cls.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : cls.status === "upcoming"
                              ? "border-blue-200 bg-blue-50 text-blue-800"
                              : "border-stone-200 bg-stone-100 text-stone-500"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/classes/${cls.id}/manage`)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      <Settings2 size={13} /> Manage materials
                    </button>
                  </div>
                </div>
              );
            })}

            {classes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
                You're not running any classes yet — set one up from My Classes.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                  <BookOpen size={14} /> Your courses
                </h3>
                <button onClick={() => navigate("/trainer/courses")} className="text-xs font-semibold text-brand-700 hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {myCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/trainer/courses/${course.id}/manage`)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <img src={course.thumbnailImage} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-800">{course.title}</p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${STATUS_PILL[course.status]}`}>
                      {course.status}
                    </span>
                    <ArrowRight size={12} className="shrink-0 text-stone-400" />
                  </button>
                ))}
                {myCourses.length === 0 && <p className="text-xs text-stone-400">No courses yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
