import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function PublicShell({ children }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-stone-50">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-8">
        <button onClick={() => navigate("/catalog")} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <GraduationCap size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-stone-900">Afenet LMS</span>
        </button>
        <button
          onClick={() => navigate("/login")}
          className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 sm:px-4 sm:py-2"
        >
          Log in / Sign up
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
