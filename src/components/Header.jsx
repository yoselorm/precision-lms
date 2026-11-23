import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu, Award, Users, BellOff, BookOpen, FileText, CalendarDays, Star, Info, Loader2, CheckCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/authSlice";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsStatus,
  selectHasMoreNotifications,
} from "../store/slices/notificationsSlice";
import { timeAgo } from "../utils/time";

// How often the unread badge is refreshed (there's no live push).
const POLL_MS = 60000;

// Where a notification leads, and its icon. Types are short strings from
// the server ("certificate_issued", "trainer_pending_approval", ...); new
// ones can appear at any time, so this matches on what the type mentions
// and falls back to the ids it carries. Unknown types still show their
// message — they just don't link anywhere.
function notificationTarget({ type, data }, role) {
  const t = type.toLowerCase();
  const courseId = data.course_id;
  const classId = data.school_class_id || data.class_id;
  if (t.includes("certificate")) {
    if (role === "admin") return { icon: Award, to: "/admin/certificates" };
    return { icon: Award, to: role === "learner" ? "/certificates" : null };
  }
  if (t.includes("trainer") || t.includes("user") || t.includes("registration") || t.includes("account")) {
    return { icon: Users, to: role === "admin" ? "/admin/users" : null };
  }
  if (t.includes("rating") || t.includes("review")) {
    return { icon: Star, to: role === "admin" ? "/admin/reviews" : courseId ? `/course/${courseId}` : null };
  }
  if (t.includes("assignment") || t.includes("submission") || t.includes("grade")) return { icon: FileText, to: "/assignments" };
  if (t.includes("class") || classId) return { icon: CalendarDays, to: classId ? `/classes/${classId}` : "/classes" };
  if (t.includes("course") || t.includes("revision") || t.includes("enroll") || courseId) {
    if (role === "admin") return { icon: BookOpen, to: courseId ? `/admin/courses/${courseId}/manage` : "/admin/courses" };
    if (role === "trainer" && !t.includes("enroll")) return { icon: BookOpen, to: courseId ? `/trainer/courses/${courseId}/manage` : "/trainer/courses" };
    return { icon: BookOpen, to: courseId ? `/course/${courseId}` : "/my-courses" };
  }
  return { icon: Info, to: null };
}

// The bell: the account's notifications from the server. The unread count
// is polled (and refreshed when the tab regains focus); the list loads when
// the panel opens.
function NotificationBell({ currentUser }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);
  const status = useSelector(selectNotificationsStatus);
  const hasMore = useSelector(selectHasMoreNotifications);
  const token = useSelector((state) => state.auth.token);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    const refresh = () => {
      if (document.visibilityState === "visible") dispatch(fetchUnreadCount());
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [dispatch, token]);

  const toggle = () => {
    if (!open) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
    setOpen((v) => !v);
  };

  const openItem = (n, to) => {
    if (!n.readAt) dispatch(markNotificationRead({ id: n.id }));
    if (to) {
      setOpen(false);
      navigate(to);
    }
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative text-stone-400 hover:text-stone-600" aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2.5 w-80 max-w-[calc(100vw-2rem)] animate-scale-in rounded-xl border border-stone-200 bg-white p-2 shadow-lg sm:w-96">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => dispatch(markAllNotificationsRead())}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <CheckCheck size={12} /> Mark all as read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              status === "loading" ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-stone-400">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                  <BellOff size={20} className="text-stone-300" />
                  <p className="text-xs text-stone-400">{status === "failed" ? "Couldn't load notifications." : "You're all caught up."}</p>
                </div>
              )
            ) : (
              <div className="max-h-96 space-y-0.5 overflow-y-auto">
                {items.map((n) => {
                  const { icon: Icon, to } = notificationTarget(n, currentUser.role);
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n, to)}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-xs hover:bg-stone-50 ${n.readAt ? "text-stone-500" : "bg-brand-50/60 text-stone-800"}`}
                    >
                      <Icon size={14} className={`mt-0.5 shrink-0 ${n.readAt ? "text-stone-400" : "text-brand-600"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block leading-snug ${n.readAt ? "" : "font-semibold"}`}>{n.message || "New notification"}</span>
                        <span className="mt-0.5 block text-[10px] text-stone-400">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  );
                })}
                {hasMore && (
                  <button
                    onClick={() => dispatch(fetchNotifications({ more: true }))}
                    disabled={status === "loading"}
                    className="w-full rounded-lg py-2 text-[11px] font-semibold text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {status === "loading" ? "Loading..." : "Show older"}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Header({ title, subtitle, showSearch = false, onMenuClick }) {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
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
            <NotificationBell currentUser={currentUser} />
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
