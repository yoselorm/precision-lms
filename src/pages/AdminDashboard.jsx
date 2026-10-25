import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldCheck, Users, BookOpen, Wallet, CalendarDays, GraduationCap, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllEnrollments } from "../store/slices/enrollmentsSlice";
import { selectAllClasses } from "../store/slices/classesSlice";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-stone-900 leading-tight">{value}</p>
        <p className="truncate text-[11px] text-stone-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onMenuClick }) {
  const navigate = useNavigate();
  const users = useSelector(selectAllUsers);
  const courses = useSelector(selectAllCourses);
  const enrollments = useSelector(selectAllEnrollments);
  const classes = useSelector(selectAllClasses);

  const learnerCount = users.filter((u) => u.role === "learner").length;
  const trainerCount = users.filter((u) => u.role === "trainer").length;

  const revenue = enrollments.reduce((sum, e) => {
    const course = courses.find((c) => c.id === e.courseId);
    return sum + (course?.price || 0);
  }, 0);

  const publishedCourses = courses.filter((c) => (c.status || "approved") === "approved");
  const completionByCourse = publishedCourses.map((course) => {
    const relevant = enrollments.filter((e) => e.courseId === course.id);
    const completed = relevant.filter((e) => e.status === "completed").length;
    const rate = relevant.length ? Math.round((completed / relevant.length) * 100) : 0;
    return { course, completed, total: relevant.length, rate };
  });

  const topCourses = [...courses]
    .map((c) => ({ course: c, enrolled: enrollments.filter((e) => e.courseId === c.id).length }))
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 5);

  const classRows = classes.map((cls) => {
    const classCourseIds = (cls.courses || []).map((c) => c.courseId);
    const classCourses = classCourseIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
    const trainer = users.find((u) => u.id === cls.trainerId);
    const memberEnrollments = enrollments.filter((e) => classCourseIds.includes(e.courseId) && cls.memberIds.includes(e.userId));
    const avgProgress = memberEnrollments.length
      ? Math.round(memberEnrollments.reduce((sum, e) => sum + e.progress, 0) / memberEnrollments.length)
      : 0;
    return { cls, classCourses, trainer, avgProgress };
  });

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Admin Overview" subtitle="Org-wide training activity, compliance, and revenue." showSearch onMenuClick={onMenuClick} />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users} label="Learners" value={learnerCount} accent="#16a34a" />
          <StatCard icon={GraduationCap} label="Trainers" value={trainerCount} accent="#7c3aed" />
          <StatCard icon={BookOpen} label="Courses" value={courses.length} accent="#9333ea" />
          <StatCard icon={CalendarDays} label="Classes" value={classes.length} accent="#0891b2" />
          <StatCard icon={Wallet} label="Revenue" value={`GH₵${revenue}`} accent="#ea580c" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left / center column */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                  <ShieldCheck size={15} className="text-emerald-700" /> Course completion
                </h2>
              </div>
              <div className="space-y-4">
                {completionByCourse.map(({ course, completed, total, rate }) => (
                  <div key={course.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">{course.title}</span>
                      <span className="text-stone-400">
                        {completed}/{total} complete — {rate}%
                      </span>
                    </div>
                    <ProgressBar value={rate} colorClass={rate >= 80 ? "bg-emerald-600" : rate >= 50 ? "bg-amber-500" : "bg-rose-500"} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                  <CalendarDays size={15} className="text-brand-700" /> Classes overview
                </h2>
                <button onClick={() => navigate("/admin/classes")} className="text-xs font-semibold text-brand-700 hover:underline">
                  Manage all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="py-2 pr-2">Class</th>
                      <th className="py-2 pr-2">Trainer</th>
                      <th className="py-2 pr-2">Progress</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {classRows.map(({ cls, classCourses, trainer, avgProgress }) => (
                      <tr key={cls.id}>
                        <td className="py-2.5 pr-2">
                          <p className="font-semibold text-stone-800">{cls.title}</p>
                          <p className="text-[10px] text-stone-400">
                            {classCourses.length === 0
                              ? "No course attached"
                              : classCourses.length === 1
                              ? classCourses[0].title
                              : `${classCourses[0].title} +${classCourses.length - 1} more`}
                          </p>
                        </td>
                        <td className="py-2.5 pr-2 text-stone-500">{trainer?.name ?? "—"}</td>
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ProgressBar value={avgProgress} heightClass="h-1.5" />
                            </div>
                            <span className="text-[10px] text-stone-400">{avgProgress}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${
                              cls.status === "active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : cls.status === "upcoming"
                                ? "border-blue-200 bg-blue-50 text-blue-800"
                                : "border-stone-200 bg-stone-100 text-stone-500"
                            }`}
                          >
                            {cls.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => navigate(`/classes/${cls.id}/manage`)} className="text-stone-400 hover:text-brand-700">
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-stone-800">Top courses by enrollment</h2>
              <div className="space-y-3">
                {topCourses.map(({ course, enrolled }) => (
                  <div key={course.id} className="flex items-center gap-2.5">
                    <img src={course.thumbnailImage} alt="" className="h-9 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-stone-800">{course.title}</p>
                      <p className="text-[10px] text-stone-400">{enrolled} enrolled</p>
                    </div>
                    {course.price > 0 ? (
                      <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700">GH₵{course.price}</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Free</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-stone-800">Quick actions</h2>
              <div className="space-y-2">
                <button onClick={() => navigate("/admin/courses")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Add a course <ArrowRight size={13} />
                </button>
                <button onClick={() => navigate("/admin/users")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Add a user <ArrowRight size={13} />
                </button>
                <button onClick={() => navigate("/admin/classes")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Set up a class <ArrowRight size={13} />
                </button>
                <button onClick={() => navigate("/admin/certificates")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Create a certificate <ArrowRight size={13} />
                </button>
                <button onClick={() => navigate("/admin/enroll")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Enroll learners <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
