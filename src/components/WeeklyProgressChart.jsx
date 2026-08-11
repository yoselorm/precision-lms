import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

export default function WeeklyProgressChart({ data }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
          <TrendingUp size={15} className="text-brand-700" /> Your learning progress
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="#f1f0ef" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            cursor={{ fill: "#f5f5f4" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }}
          />
          <Bar dataKey="completed" name="Completed" fill="#15803d" radius={[4, 4, 0, 0]} />
          <Bar dataKey="inProgress" name="In progress" fill="#86efac" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-700" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-300" /> In progress
        </span>
      </div>
    </div>
  );
}
