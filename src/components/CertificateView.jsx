import React from "react";
import { Award, X, GraduationCap } from "lucide-react";

export default function CertificateView({ learnerName, courseTitle, issuer, completedAt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/80 hover:text-white">
          <X size={22} />
        </button>
        <div className="rounded-2xl border-8 border-brand-100 bg-white p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Award size={28} className="text-brand-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Certificate of Completion</p>
          <h1 className="mt-4 text-2xl font-extrabold text-stone-900 sm:text-3xl">{learnerName}</h1>
          <p className="mt-2 text-sm text-stone-500">has successfully completed</p>
          <h2 className="mt-2 text-lg font-bold text-brand-800 sm:text-xl">{courseTitle}</h2>
          <p className="mt-4 text-xs text-stone-400">
            Issued {new Date(completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-4 text-left">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-brand-700" />
              <span className="text-xs font-bold text-stone-700">Afenet LMS</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-stone-700">{issuer}</p>
              <p className="text-[10px] text-stone-400">Issuing department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
