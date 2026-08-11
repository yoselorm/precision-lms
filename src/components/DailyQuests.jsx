import React, { useState } from "react";
import { Gem } from "lucide-react";
import ProgressBar from "./ProgressBar";

export default function DailyQuests({ quests }) {
  const [claimed, setClaimed] = useState(() => new Set(quests.filter((q) => q.claimed).map((q) => q.id)));

  const claim = (id) => setClaimed((prev) => new Set(prev).add(id));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold text-stone-800">Daily quests</h2>
      <div className="space-y-4">
        {quests.map((q) => {
          const complete = q.progress >= q.total;
          const isClaimed = claimed.has(q.id);
          return (
            <div key={q.id}>
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <Gem size={14} className="text-amber-500" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-stone-800 leading-tight">{q.title}</p>
                    <p className="text-[10px] font-semibold text-amber-600">+{q.reward} Points</p>
                  </div>
                </div>
                <button
                  onClick={() => claim(q.id)}
                  disabled={!complete || isClaimed}
                  className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
                >
                  {isClaimed ? "Claimed" : "Claim"}
                </button>
              </div>
              <ProgressBar value={(q.progress / q.total) * 100} heightClass="h-1.5" colorClass={complete ? "bg-amber-500" : "bg-brand-600"} />
              <p className="mt-1 text-[10px] text-stone-400">
                {q.progress}/{q.total} completed
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
