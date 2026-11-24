import React from "react";
import { Users } from "lucide-react";

const joinedDate = (value) =>
  new Date(String(value).replace(" ", "T")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// A class's students. The full roster (with emails) is for the class's
// trainer and admins (`showRoster`); others just see how many there are.
export default function ClassRoster({ cls, showRoster, isMember }) {
  const count = cls.members?.length ?? cls.memberCount;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-stone-800">
        <Users size={14} /> Students ({count})
      </h3>
      {count === 0 ? (
        <p className="text-xs text-stone-400">No students have joined this class yet.</p>
      ) : showRoster && cls.members ? (
        <ul className="mt-3 divide-y divide-stone-100">
          {[...cls.members]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-2 text-xs">
                <span className="min-w-0">
                  <span className="font-semibold text-stone-800">{m.name}</span>
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="ml-2 break-all text-stone-500 hover:text-brand-700 hover:underline">
                      {m.email}
                    </a>
                  )}
                </span>
                {m.joinedAt && <span className="text-[11px] text-stone-400">Joined {joinedDate(m.joinedAt)}</span>}
              </li>
            ))}
        </ul>
      ) : showRoster ? (
        <p className="text-xs text-stone-400">Loading the roster...</p>
      ) : (
        <p className="text-xs text-stone-400">{isMember ? "You're in this class." : "Join the class to take part."}</p>
      )}
    </div>
  );
}
