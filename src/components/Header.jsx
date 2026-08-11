import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/authSlice";

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

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {currentUser ? (
          <>
            <button className="relative text-stone-400 hover:text-stone-600">
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
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
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 sm:px-4 sm:py-2"
          >
            Log in / Sign up
          </button>
        )}
      </div>
    </header>
  );
}
