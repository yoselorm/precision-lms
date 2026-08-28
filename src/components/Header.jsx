import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu, AlertTriangle, Clock, Award, Users, TrendingDown, BellOff } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/authSlice";
import { selectPendingTrainers } from "../store/slices/usersSlice";
import { selectAllEnrollments, selectEnrollmentsByUser } from "../store/slices/enrollmentsSlice";
import { selectClassesByTrainer } from "../store/slices/classesSlice";
import { selectAllCourses } from "../store/slices/coursesSlice";
import { isOverdue } from "./StatusBadge";

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (24 * 60 * 60 * 1000));
}

// Role-aware, derived from existing state each render — no dedicated
// notifications slice needed since everything here is computable from data
// that already exists (enrollments, classes, pending approvals).
function useNotifications(currentUser) {
  const pendingTrainers = useSelector(selectPendingTrainers);
  const allEnrollments = useSelector(selectAllEnrollments);
  const myClasses = useSelector((state) => (currentUser?.role === "trainer" ? selectClassesByTrainer(state, currentUser.id) : []));
  const myEnrollments = useSelector((state) => (currentUser ? selectEnrollmentsByUser(state, currentUser.id) : []));
  const courses = useSelector(selectAllCourses);

  return useMemo(() => {
    if (!currentUser) return [];
    const items = [];

    if (currentUser.role === "admin") {
      if (pendingTrainers.length > 0) {
        items.push({
          id: "pending-trainers",
          icon: Users,
          text: `${pendingTrainers.length} trainer application${pendingTrainers.length > 1 ? "s" : ""} awaiting approval`,
          to: "/admin/users",
        });
      }
      const overdueCount = allEnrollments.filter((e) => isOverdue(e.dueDate, e.status)).length;
      if (overdueCount > 0) {
        items.push({
          id: "org-overdue",
          icon: AlertTriangle,
          text: `${overdueCount} overdue enrollment${overdueCount > 1 ? "s" : ""} org-wide`,
          to: "/admin",
        });
      }
    }

    if (currentUser.role === "trainer") {
      const startingSoon = myClasses.filter((c) => c.status === "upcoming" && daysUntil(c.startDate) <= 7 && daysUntil(c.startDate) >= 0);
      startingSoon.forEach((c) =>
        items.push({ id: `class-soon-${c.id}`, icon: Clock, text: `"${c.title}" starts in ${daysUntil(c.startDate)} day(s)`, to: `/classes/${c.id}/manage` })
      );
      const laggingClasses = myClasses.filter((c) => {
        if (c.status !== "active") return false;
        const relevant = allEnrollments.filter((e) => e.courseId === c.courseId && c.memberIds.includes(e.userId));
        if (relevant.length === 0) return false;
        const avg = relevant.reduce((sum, e) => sum + e.progress, 0) / relevant.length;
        return avg < 40;
      });
      laggingClasses.forEach((c) => items.push({ id: `class-lag-${c.id}`, icon: TrendingDown, text: `"${c.title}" progress is falling behind`, to: `/classes/${c.id}/manage` }));
    }

    if (currentUser.role === "learner") {
      const overdue = myEnrollments.filter((e) => isOverdue(e.dueDate, e.status));
      if (overdue.length > 0) {
        items.push({ id: "my-overdue", icon: AlertTriangle, text: `${overdue.length} course${overdue.length > 1 ? "s" : ""} overdue`, to: "/my-courses" });
      }
      const dueSoon = myEnrollments.filter((e) => e.status !== "completed" && daysUntil(e.dueDate) >= 0 && daysUntil(e.dueDate) <= 3);
      dueSoon.forEach((e) => {
        const course = courses.find((c) => c.id === e.courseId);
        if (course) items.push({ id: `due-soon-${e.id}`, icon: Clock, text: `"${course.title}" due in ${daysUntil(e.dueDate)} day(s)`, to: "/my-courses" });
      });
      const recentCerts = myEnrollments.filter((e) => e.status === "completed" && e.completedAt && Math.abs(daysUntil(e.completedAt)) <= 7);
      recentCerts.forEach((e) => {
        const course = courses.find((c) => c.id === e.courseId);
        if (course?.certificate) items.push({ id: `cert-${e.id}`, icon: Award, text: `New certificate earned: ${course.title}`, to: "/certificates" });
      });
    }

    return items;
  }, [currentUser, pendingTrainers, allEnrollments, myClasses, myEnrollments, courses]);
}

export default function Header({ title, subtitle, showSearch = false, onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const notifications = useNotifications(currentUser);
  const [notifOpen, setNotifOpen] = useState(false);
  const initials = currentUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="shrink-0 text-stone-500 hover:text-stone-700 lg:hidden">
            <Menu size={20} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-stone-900 sm:text-lg">{title}</h1>
          {subtitle && <p className="hidden truncate text-sm text-stone-500 sm:block">{subtitle}</p>}
        </div>
      </div>

      {showSearch && (
        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm md:flex focus-within:border-brand-600 focus-within:bg-white transition">
          <Search size={15} className="text-stone-400" />
          <input
            type="text"
            placeholder="Search by topic, title, or name"
            className="w-full bg-transparent outline-none placeholder:text-stone-400"
          />
        </div>
      )}

      {/* Anonymous visitors are always inside PublicShell, which already
          shows its own "Log in / Sign up" CTA in the outer header — so
          there's nothing for this bar to show when there's no currentUser,
          rather than rendering a second, redundant login button. */}
      {currentUser && (
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="relative text-stone-400 hover:text-stone-600">
                <Bell size={18} />
                {notifications.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2.5 w-72 animate-scale-in rounded-xl border border-stone-200 bg-white p-2 shadow-lg sm:w-80">
                    <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">Notifications</p>
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                        <BellOff size={20} className="text-stone-300" />
                        <p className="text-xs text-stone-400">You're all caught up.</p>
                      </div>
                    ) : (
                      <div className="max-h-80 space-y-0.5 overflow-y-auto">
                        {notifications.map((n) => {
                          const Icon = n.icon;
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                setNotifOpen(false);
                                navigate(n.to);
                              }}
                              className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-stone-700 hover:bg-stone-50"
                            >
                              <Icon size={14} className="mt-0.5 shrink-0 text-brand-600" />
                              <span className="leading-snug">{n.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {initials}
                </div>
              )}
              <div className="hidden text-sm sm:block">
                <p className="font-semibold text-stone-800 leading-tight">{currentUser.name}</p>
                <p className="text-[11px] text-stone-400 leading-tight">{currentUser.department}</p>
              </div>
            </div>
        </div>
      )}
    </header>
  );
}
