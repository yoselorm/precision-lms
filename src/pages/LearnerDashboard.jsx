import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Award, Flame, CalendarClock, AlertTriangle } from "lucide-react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import CourseCard from "../components/CourseCard";
import ContinueWatching from "../components/ContinueWatching";
import Leaderboard from "../components/Leaderboard";
import WeeklyProgressChart from "../components/WeeklyProgressChart";
import DailyQuests from "../components/DailyQuests";
import CircularProgress from "../components/CircularProgress";
import ProgressBar from "../components/ProgressBar";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import { isOverdue } from "../components/StatusBadge";
import { weeklyProgress, mockDailyQuests } from "../data/mockData";

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

export default function LearnerDashboard({ onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const courses = useSelector(selectAllCourses);
  const allUsers = useSelector(selectAllUsers);
  const enrollments = useSelector((state) => selectEnrollmentsByUser(state, currentUser.id));

  const enrollmentByCourseId = Object.fromEntries(enrollments.map((e) => [e.courseId, e]));
  const enrolledCourses = courses.filter((c) => enrollmentByCourseId[c.id]);

  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const overdueCount = enrollments.filter((e) => isOverdue(e.dueDate, e.status)).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  const continueItems = enrolledCourses
    .filter((c) => enrollmentByCourseId[c.id].status === "in-progress")
    .map((course) => ({ course, enrollment: enrollmentByCourseId[course.id] }))
    .slice(0, 3);

  const upcoming = [...enrollments]
    .filter((e) => e.status !== "completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={`Welcome back, ${currentUser.name.split(" ")[0]} \u{1F44B}`} subtitle="Here's where your training stands today." showSearch onMenuClick={onMenuClick} />

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        {/* Left + center column */}
        <div className="space-y-6 lg:col-span-2">
          <HeroBanner onExplore={() => navigate("/catalog")} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Award} label="Completed" value={completedCount} accent="#16a34a" />
            <StatCard icon={Flame} label="Day streak" value={currentUser.streakDays ?? 0} accent="#ea580c" />
            <StatCard icon={CalendarClock} label="Assigned" value={enrollments.length} accent="#2563eb" />
            <StatCard icon={AlertTriangle} label="Overdue" value={overdueCount} accent="#dc2626" />
          </div>

          <ContinueWatching items={continueItems} />

          <WeeklyProgressChart data={weeklyProgress} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">Your courses</h2>
              <button onClick={() => navigate("/catalog")} className="text-xs font-semibold text-brand-700 hover:underline">
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 gap-5 pt-1 sm:grid-cols-2">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} enrollment={enrollmentByCourseId[course.id]} />
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Overall progress</p>
                <p className="mt-1 text-2xl font-extrabold text-stone-900">{avgProgress}%</p>
                <p className="text-[11px] text-stone-400">across {enrollments.length} assigned courses</p>
              </div>
              <CircularProgress value={avgProgress} size={64} strokeWidth={6} color="#21409A" />
            </div>
          </div>

          <Leaderboard users={allUsers.filter((u) => u.role === "learner")} currentUserId={currentUser.id} onViewAll={() => navigate("/team")} />

          <DailyQuests quests={mockDailyQuests} />

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-stone-800">Upcoming deadlines</h2>
            <div className="space-y-3">
              {upcoming.length === 0 && <p className="text-xs text-stone-400">Nothing due — you're all caught up.</p>}
              {upcoming.map((e) => {
                const course = courses.find((c) => c.id === e.courseId);
                const overdue = isOverdue(e.dueDate, e.status);
                return (
                  <div key={e.id} className="border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-stone-800 leading-snug">{course.title}</p>
                      {overdue && <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-500" />}
                    </div>
                    <p className={`text-[11px] ${overdue ? "text-rose-600 font-semibold" : "text-stone-400"}`}>
                      Due {new Date(e.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                    <div className="mt-1.5">
                      <ProgressBar value={e.progress} heightClass="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
