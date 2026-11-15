import React from "react";
import { useNavigate } from "react-router-dom";
import afenetLogo from "../assets/images/afenet-logo.jpeg";

export default function PublicShell({ children }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-stone-50">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={afenetLogo} alt="AFENET" className="h-8 w-auto object-contain" />
          <span className="hidden text-sm font-bold tracking-tight text-stone-900 sm:inline">Afenet LMS</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate("/verify")} className="whitespace-nowrap text-xs font-semibold text-stone-600 hover:text-brand-700">
            Verify<span className="hidden sm:inline"> a certificate</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="whitespace-nowrap rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 sm:px-4 sm:py-2"
          >
            Log in<span className="hidden sm:inline"> / Sign up</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
