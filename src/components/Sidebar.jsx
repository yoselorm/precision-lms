import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Users,
  ShieldCheck,
  Award,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  LogOut,
  UserPlus,
  ClipboardList,
  X,
  Eye,
  LogIn,
} from "lucide-react";
import { selectCurrentUser, selectRealUser, switchDemoUser, stopPreview, logout } from "../store/slices/authSlice";
import { selectAllUsers } from "../store/slices/usersSlice";
import afenetLogo from "../assets/images/afenet-logo.jpeg";

const baseLinks = [
  { to: "/", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/catalog", label: "Course Catalog", icon: BookOpen },
  { to: "/classes", label: "Classes", icon: CalendarDays },
  { to: "/certificates", label: "My Certificates", icon: Award },
];

const adminLinks = [
  { to: "/admin", label: "Overview", icon: ShieldCheck },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: UserPlus },
  { to: "/admin/classes", label: "Classes", icon: CalendarDays },
  { to: "/admin/enroll", label: "Enroll users", icon: ClipboardList },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const realUser = useSelector(selectRealUser);
  const allUsers = useSelector(selectAllUsers);
  const [adminOpen, setAdminOpen] = useState(true);
  const canPreview = realUser?.role === "admin" || (!realUser && currentUser.role === "admin");

  // Trainers only ever see the classes they teach on this page, so the nav
  // label reflects that; admins and learners both get the full, browsable
  // "Classes" list (learners self-enroll from there).
  const links = baseLinks.map((link) =>
    link.to === "/classes" && currentUser.role === "trainer" ? { ...link, label: "My Classes" } : link
  );
  if (currentUser.role === "learner") {
    links.splice(2, 0, { to: "/my-courses", label: "My Courses", icon: BookMarked });
  }
  if (currentUser.role === "trainer") {
    links.splice(1, 0, { to: "/trainer/courses", label: "Courses", icon: BookMarked });
  }
  if (currentUser.role === "admin") {
    links.splice(3, 0, { to: "/team", label: "My Team", icon: Users });
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col overflow-hidden bg-gradient-to-b from-brand-800 via-brand-900 to-brand-950 text-brand-50 shadow-xl transition-all duration-200 lg:static
          ${collapsed ? "lg:w-[76px]" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} w-64 lg:translate-x-0`}
      >
        {/* Decorative glow accents to make the gradient feel intentional, not flat */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-10 h-40 w-40 rounded-full bg-brand-300/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-2 border-b border-white/10 px-4 py-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-white/20">
              <img src={afenetLogo} alt="AFENET" className="h-full w-full object-contain" />
            </div>
            {!collapsed && <span className="truncate text-sm font-bold tracking-tight text-white">Afenet LMS</span>}
          </div>
          <button onClick={onCloseMobile} className="text-brand-100/70 hover:text-white lg:hidden">
            <X size={18} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden shrink-0 text-brand-100/70 hover:text-white lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                    : "text-brand-100/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}

          {currentUser.role === "admin" && (
            <div className="pt-2">
              <button
                onClick={() => setAdminOpen((v) => !v)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-200/60 hover:text-brand-100 ${
                  collapsed ? "justify-center" : "justify-between"
                }`}
              >
                {!collapsed && <span>Admin</span>}
                {!collapsed && (adminOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                {collapsed && <ShieldCheck size={16} />}
              </button>
              {(adminOpen || collapsed) && (
                <div className="space-y-1">
                  {adminLinks.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/admin"}
                      onClick={onCloseMobile}
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          collapsed ? "justify-center" : "pl-6"
                        } ${
                          isActive
                            ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                            : "text-brand-100/75 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={15} className="shrink-0" />
                      {!collapsed && label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Admin-only "preview as" impersonation, so admins can sanity-check
            other roles' views without every signed-in user being able to
            hop into anyone else's account. realUser is set while previewing
            so there's always a way back to the admin's own identity. */}
        <div className="relative border-t border-white/10 bg-black/10 p-3">
          {realUser && !collapsed && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200">
              <span className="flex min-w-0 items-center gap-1.5">
                <Eye size={11} className="shrink-0" />
                <span className="truncate">Previewing as {currentUser.name}</span>
              </span>
              <button onClick={() => dispatch(stopPreview())} className="shrink-0 underline hover:text-white">
                Exit
              </button>
            </div>
          )}
          {realUser && collapsed && (
            <button onClick={() => dispatch(stopPreview())} title="Exit preview" className="mx-auto mb-2 flex text-amber-300 hover:text-white">
              <LogIn size={16} />
            </button>
          )}

          {canPreview && (
            <>
              {!collapsed && (
                <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-brand-200/60">Preview as</p>
              )}
              {!collapsed ? (
                <div className="relative mb-2">
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const user = allUsers.find((u) => u.id === e.target.value);
                      if (user) dispatch(switchDemoUser(user));
                    }}
                    className="w-full appearance-none rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer backdrop-blur-sm focus:border-white/40 [&>option]:text-stone-800"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-brand-100/70" />
                </div>
              ) : (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="mx-auto mb-2 h-9 w-9 rounded-full object-cover ring-2 ring-white/25"
                  title={currentUser.name}
                />
              )}
            </>
          )}

          <button
            onClick={handleLogout}
            title="Log out"
            className={`mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-100/70 transition hover:bg-white/10 hover:text-rose-300 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>
    </>
  );
}
