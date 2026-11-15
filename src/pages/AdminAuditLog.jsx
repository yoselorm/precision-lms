import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, History, Loader2, Search } from "lucide-react";
import Header from "../components/Header";
import { selectAllUsers } from "../store/slices/usersSlice";
import { selectCurrentUser } from "../store/slices/authSlice";
import * as adminApi from "../api/admin";

// Actions the backend records today — used for the filter dropdown.
const ACTIONS = ["impersonate", "stop-impersonating"];

const ACTION_LABEL = {
  impersonate: "Started previewing as",
  "stop-impersonating": "Stopped previewing as",
};

// "App\Models\User" -> "User"
const modelName = (type) => (type ? type.split("\\").pop() : "");

// Who did what to whom — the history of sensitive admin actions such as
// "preview as" (GET /admin/audit-logs, newest first, 25 per page).
export default function AdminAuditLog({ onMenuClick }) {
  const users = useSelector(selectAllUsers);
  const currentUser = useSelector(selectCurrentUser);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ status: "loading", logs: [], meta: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    setResult((prev) => ({ ...prev, status: "loading" }));
    adminApi
      .listAuditLogs({ page, action, search: query })
      .then((json) => !cancelled && setResult({ status: "ready", logs: json.data || [], meta: json.meta, error: "" }))
      .catch((err) => !cancelled && setResult({ status: "failed", logs: [], meta: null, error: err.message || "Couldn't load the audit log." }));
    return () => {
      cancelled = true;
    };
  }, [page, action, query]);

  // Log entries only carry ids — show names for the people we know.
  const nameFor = (id) => {
    if (!id) return "—";
    if (id === currentUser?.id) return `${currentUser.name} (you)`;
    return users.find((u) => u.id === id)?.name ?? `…${id.slice(-6)}`;
  };

  const { status, logs, meta, error } = result;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Audit log" subtitle="A record of sensitive admin actions." onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the log..."
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                    {new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {nameFor(log.actor_id)}
                    <span className="ml-1 font-normal text-stone-400">{modelName(log.actor_type)}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{ACTION_LABEL[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {log.target_id ? (
                      <>
                        {nameFor(log.target_id)}
                        <span className="ml-1 text-stone-400">{modelName(log.target_type)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {status === "loading" && (
            <p className="flex items-center justify-center gap-2 p-6 text-xs text-stone-400">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </p>
          )}
          {status === "failed" && <p className="p-6 text-center text-xs text-rose-600">{error}</p>}
          {status === "ready" && logs.length === 0 && (
            <p className="flex flex-col items-center gap-2 p-10 text-center text-sm text-stone-400">
              <History size={22} className="text-stone-300" /> Nothing recorded{query || action ? " for this filter" : " yet"}.
            </p>
          )}
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 text-xs text-stone-500">
            <span>
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || status === "loading"}
              className="rounded-lg border border-stone-200 bg-white p-1.5 hover:bg-stone-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage || status === "loading"}
              className="rounded-lg border border-stone-200 bg-white p-1.5 hover:bg-stone-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
