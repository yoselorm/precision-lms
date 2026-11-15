import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldCheck, Users, BookOpen, Wallet, CalendarDays, GraduationCap, ArrowRight, Clock, Award, ClipboardList } from "lucide-react";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectAllClasses } from "../store/slices/classesSlice";
import { selectDashboardStats } from "../store/slices/dashboardSlice";
import { usePageData } from "../hooks/usePageData";
import { loadDashboard } from "../store/loadAppData";

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

// Platform-wide numbers come from GET /admin/dashboard; the class and
// review lists come from the loaded classes/courses.
export default function AdminDashboard({ onMenuClick }) {
  usePageData(loadDashboard);
  const navigate = useNavigate();
  const stats = useSelector(selectDashboardStats);
  const courses = useSelector(selectAllCourses);
  const classes = useSelector(selectAllClasses);

  const enrollments = stats?.enrollments ?? { total: 0, completed: 0, in_progress: 0, not_started: 0 };
  const courseStats = stats?.courses ?? { total: courses.length, draft: 0, pending: 0, approved: 0, denied: 0 };
  const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
  const awaitingReview = courses.filter((c) => c.status === "pending");

  const breakdowns = [
    {
      title: "Enrollments",
      icon: ShieldCheck,
      total: enrollments.total,
      rows: [
        { label: "Completed", value: enrollments.completed, color: "bg-emerald-600" },
        { label: "In progress", value: enrollments.in_progress, color: "bg-amber-500" },
        { label: "Not started", value: enrollments.not_started, color: "bg-stone-400" },
      ],
    },
    {
      title: "Courses by status",
      icon: BookOpen,
      total: courseStats.total,
      rows: [
        { label: "Approved", value: courseStats.approved, color: "bg-emerald-600" },
        { label: "Pending review", value: courseStats.pending, color: "bg-amber-500" },
        { label: "Draft", value: courseStats.draft, color: "bg-blue-500" },
        { label: "Denied", value: courseStats.denied, color: "bg-rose-500" },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Admin Overview" subtitle="Org-wide training activity, compliance, and revenue." showSearch onMenuClick={onMenuClick} />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Learners" value={stats?.users?.learners ?? 0} accent="#16a34a" />
          <StatCard icon={GraduationCap} label="Trainers" value={stats?.users?.trainers ?? 0} accent="#7c3aed" />
          <StatCard icon={Clock} label="Trainers awaiting approval" value={stats?.users?.pending_trainers ?? 0} accent="#d97706" />
          <StatCard icon={BookOpen} label="Courses" value={courseStats.total} accent="#9333ea" />
          <StatCard icon={CalendarDays} label="Classes" value={stats?.classes?.total ?? classes.length} accent="#0891b2" />
          <StatCard icon={ClipboardList} label="Open assignments" value={stats?.assignments?.open ?? 0} accent="#2563eb" />
          <StatCard icon={Award} label="Certificates issued" value={stats?.certificates_issued ?? 0} accent="#0f766e" />
          <StatCard icon={Wallet} label="Revenue" value={`GH₵${stats?.revenue ?? 0}`} accent="#ea580c" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left / center column */}
          <div className="space-y-5 lg:col-span-2">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {breakdowns.map(({ title, icon: Icon, total, rows }) => (
                <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <h2 className="mb-4 flex items-center gap-1.5 text-sm font-bold text-stone-800">
                    <Icon size={15} className="text-emerald-700" /> {title}
                    <span className="ml-auto text-xs font-semibold text-stone-400">{total} total</span>
                  </h2>
                  <div className="space-y-3">
                    {rows.map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-700">{label}</span>
                          <span className="text-stone-400">
                            {value} — {pct(value, total)}%
                          </span>
                        </div>
                        <ProgressBar value={pct(value, total)} colorClass={color} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                  <CalendarDays size={15} className="text-brand-700" /> Classes overview
                </h2>
                <button onClick={() => navigate("/admin/classes")} className="text-xs font-semibold text-brand-700 hover:underline">
                  View all
                </button>
              </div>
              {classes.length === 0 ? (
                <p className="text-xs text-stone-400">No classes yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                      <tr>
                        <th className="py-2 pr-2">Class</th>
                        <th className="py-2 pr-2">Trainer</th>
                        <th className="py-2 pr-2">Learners</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {classes.map((cls) => (
                        <tr key={cls.id}>
                          <td className="py-2.5 pr-2">
                            <p className="font-semibold text-stone-800">{cls.title}</p>
                            <p className="text-[10px] text-stone-400">
                              {cls.startDate} — {cls.endDate}
                            </p>
                          </td>
                          <td className="py-2.5 pr-2 text-stone-500">{cls.trainerName ?? "—"}</td>
                          <td className="py-2.5 pr-2 text-stone-500">{cls.memberCount}</td>
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
                            <button onClick={() => navigate(`/classes/${cls.id}`)} className="text-stone-400 hover:text-brand-700">
                              <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-stone-800">Awaiting your review</h2>
              <div className="space-y-3">
                {awaitingReview.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => navigate("/admin/courses")}
                    className="flex w-full items-center gap-2.5 text-left"
                  >
                    <img src={course.thumbnailImage} alt="" className="h-9 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-stone-800">{course.title}</p>
                      <p className="text-[10px] text-stone-400">{course.category}</p>
                    </div>
                    <ArrowRight size={13} className="shrink-0 text-stone-400" />
                  </button>
                ))}
                {awaitingReview.length === 0 && <p className="text-xs text-stone-400">No courses waiting for approval.</p>}
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
                <button onClick={() => navigate("/admin/categories")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Manage categories <ArrowRight size={13} />
                </button>
                <button onClick={() => navigate("/admin/certificates")} className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Create a certificate <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
