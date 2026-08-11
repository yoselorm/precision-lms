import React from "react";
import { Trophy } from "lucide-react";

const RANK_STYLES = {
  1: "bg-amber-100 text-amber-700 border-amber-300",
  2: "bg-stone-200 text-stone-600 border-stone-300",
  3: "bg-orange-100 text-orange-700 border-orange-300",
};

export default function Leaderboard({ users, currentUserId, onViewAll }) {
  const ranked = [...users].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((u, i) => ({ ...u, rank: i + 1 }));
  const me = ranked.find((u) => u.id === currentUserId);
  const top = ranked.slice(0, 4);
  const showMeSeparately = me && me.rank > 4;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
          <Trophy size={15} className="text-amber-500" /> Leaderboard
        </h2>
        <button onClick={onViewAll} className="text-xs font-semibold text-brand-700 hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-1">
        {top.map((u) => (
          <LeaderRow key={u.id} user={u} isMe={u.id === currentUserId} />
        ))}
        {showMeSeparately && (
          <>
            <div className="my-1 flex justify-center text-stone-300">···</div>
            <LeaderRow user={me} isMe />
          </>
        )}
      </div>
    </div>
  );
}

function LeaderRow({ user, isMe }) {
  const rankStyle = RANK_STYLES[user.rank] || "bg-stone-100 text-stone-500 border-stone-200";
  return (
    <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${isMe ? "bg-brand-50" : ""}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${rankStyle}`}>
        {user.rank}
      </span>
      <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-semibold ${isMe ? "text-brand-800" : "text-stone-800"}`}>
          {user.name} {isMe && <span className="text-[10px] font-normal text-brand-600">(you)</span>}
        </p>
        <p className="text-[10px] text-stone-400">{user.department}</p>
      </div>
      <span className="shrink-0 text-xs font-bold text-stone-700">{user.points} pts</span>
    </div>
  );
}
