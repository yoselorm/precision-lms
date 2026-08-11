import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, BookOpen, CalendarClock, TrendingUp, Settings2, CalendarDays } from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import CircularProgress from "../components/CircularProgress";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectClassesByTrainer } from "../store/slices/classesSlice";
import { selectCourseById } from "../store/slices/coursesSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";

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

export default function TrainerDashboard({ onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const classes = useSelector((state) => selectClassesByTrainer(state, currentUser.id));
  const users = useSelector(selectAllUsers);
  const enrollments = useSelector(selectAllEnrollments);
  const courses = useSelector((state) => state.courses.courses);

  const totalStudents = new Set(classes.flatMap((c) => c.memberIds)).size;
  const activeClasses = classes.filter((c) => c.status === "active").length;

  const classRows = classes.map((cls) => {
    const course = courses.find((c) => c.id === cls.courseId);
    const members = users.filter((u) => cls.memberIds.includes(u.id));
    const memberEnrollments = enrollments.filter((e) => e.courseId === cls.courseId && cls.memberIds.includes(e.userId));
    const avgProgress = memberEnrollments.length
      ? Math.round(memberEnrollments.reduce((sum, e) => sum + e.progress, 0) / memberEnrollments.length)
      : 0;
    return { cls, course, members, avgProgress };
  });

  const overallAvg = classRows.length
    ? Math.round(classRows.reduce((sum, r) => sum + r.avgProgress, 0) / classRows.length)
    : 0;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={`Welcome back, ${currentUser.name.split(" ")[0]}`} subtitle="Here's how your classes are progressing." showSearch onMenuClick={onMenuClick} />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={CalendarDays} label="Classes" value={classes.length} accent="#7c3aed" />
          <StatCard icon={Users} label="Total learners" value={totalStudents} accent="#2563eb" />
          <StatCard icon={TrendingUp} label="Avg. progress" value={`${overallAvg}%`} accent="#16a34a" />
          <StatCard icon={CalendarClock} label="Active now" value={activeClasses} accent="#ea580c" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-bold text-stone-800">Your classes</h2>
            {classRows.map(({ cls, course, members, avgProgress }) => (
              <div key={cls.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {course && <img src={course.thumbnailImage} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-stone-900">{cls.title}</h3>
                        <p className="truncate text-xs text-stone-500">{course?.title ?? "No course attached"}</p>
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

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="-space-x-2 flex">
                        {members.slice(0, 5).map((m) => (
                          <img key={m.id} src={m.avatarUrl} alt={m.name} title={m.name} className="h-6 w-6 rounded-full border-2 border-white object-cover" />
                        ))}
                      </div>
                      <div className="flex-1">
                        <ProgressBar value={avgProgress} heightClass="h-1.5" />
                      </div>
                      <span className="shrink-0 text-xs font-mono text-stone-500">{avgProgress}%</span>
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
            ))}

            {classRows.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-400">
                No classes assigned to you yet.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Overall class progress</p>
              <CircularProgress value={overallAvg} size={100} strokeWidth={9} color="#15803d" />
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-stone-800">
                <BookOpen size={14} /> Courses you teach from
              </h3>
              <div className="space-y-2">
                {[...new Set(classRows.map((r) => r.course?.id).filter(Boolean))].map((courseId) => {
                  const course = courses.find((c) => c.id === courseId);
                  return (
                    <div key={courseId} className="flex items-center gap-2 text-xs">
                      <img src={course.thumbnailImage} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                      <span className="truncate font-medium text-stone-700">{course.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
