import React from "react";
import { ArrowRight } from "lucide-react";

export default function HeroBanner({ onExplore }) {
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-8 py-7">
      <div className="relative z-10 max-w-md">
        <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-100">
          New this month
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight text-white">
          4 new courses just landed
        </h2>
        <p className="mt-2 text-sm text-brand-50/90">
          Fresh training on client communication, project management, and more —
          picked up where your last course left off? Jump right back in.
        </p>
        <button
          onClick={onExplore}
          className="mt-5 flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          Explore courses <ArrowRight size={15} />
        </button>
      </div>

      {/* Decorative flat-design illustration — abstract, no external imagery */}
      <svg viewBox="0 0 260 200" className="absolute -right-4 bottom-0 hidden h-full w-auto opacity-95 sm:block" xmlns="http://www.w3.org/2000/svg">
        <circle cx="170" cy="100" r="85" fill="#ffffff" fillOpacity="0.08" />
        <circle cx="170" cy="100" r="60" fill="#ffffff" fillOpacity="0.08" />
        {/* Desk */}
        <rect x="60" y="150" width="150" height="10" rx="2" fill="#ffffff" fillOpacity="0.25" />
        {/* Laptop */}
        <rect x="110" y="120" width="60" height="34" rx="3" fill="#ffffff" fillOpacity="0.9" />
        <rect x="116" y="126" width="48" height="22" rx="1.5" fill="#21409A" />
        <rect x="100" y="150" width="80" height="6" rx="2" fill="#ffffff" fillOpacity="0.6" />
        {/* Books stack */}
        <rect x="55" y="135" width="36" height="9" rx="1.5" fill="#facc15" />
        <rect x="58" y="126" width="30" height="9" rx="1.5" fill="#f97316" />
        <rect x="55" y="117" width="36" height="9" rx="1.5" fill="#38bdf8" />
        {/* Person */}
        <circle cx="140" cy="70" r="16" fill="#fcd9b8" />
        <path d="M118 118c2-18 12-28 22-28s20 10 22 28" fill="#ffffff" fillOpacity="0.9" />
        {/* Floating badge/certificate */}
        <g transform="translate(196 48)">
          <circle cx="0" cy="0" r="18" fill="#facc15" />
          <path d="M-7 0l5 5 9-10" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
