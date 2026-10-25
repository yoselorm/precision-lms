import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Award, Flame, CalendarClock } from "lucide-react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import CourseCard from "../components/CourseCard";
import ContinueWatching from "../components/ContinueWatching";
import WeeklyProgressChart from "../components/WeeklyProgressChart";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";
import { weeklyProgress } from "../data/mockData";

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
  const enrollments = useSelector((state) => selectEnrollmentsByUser(state, currentUser.id));

  const enrollmentByCourseId = Object.fromEntries(enrollments.map((e) => [e.courseId, e]));
  const enrolledCourses = courses.filter((c) => enrollmentByCourseId[c.id]);

  const completedCount = enrollments.filter((e) => e.status === "completed").length;

  const continueItems = enrolledCourses
    .filter((c) => enrollmentByCourseId[c.id].status === "in-progress")
    .map((course) => ({ course, enrollment: enrollmentByCourseId[course.id] }))
    .slice(0, 3);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title={`Welcome back, ${currentUser.name.split(" ")[0]} \u{1F44B}`} subtitle="Here's where your training stands today." showSearch onMenuClick={onMenuClick} />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <HeroBanner onExplore={() => navigate("/catalog")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Award} label="Completed" value={completedCount} accent="#16a34a" />
            <StatCard icon={Flame} label="Day streak" value={currentUser.streakDays ?? 0} accent="#ea580c" />
            <StatCard icon={CalendarClock} label="Assigned" value={enrollments.length} accent="#2563eb" />
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
            <div className="grid grid-cols-1 gap-5 pt-1 sm:grid-cols-2 xl:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} enrollment={enrollmentByCourseId[course.id]} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
