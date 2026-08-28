import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, X, Check, Ban, Clock } from "lucide-react";
import Header from "../components/Header";
import { selectAllUsers, addUser, setUserStatus } from "../store/slices/usersSlice";
import { pushToast } from "../store/slices/uiSlice";

const ROLES = ["learner", "admin", "trainer"];

const ROLE_PILL = {
  learner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  trainer: "bg-violet-50 text-violet-700 border-violet-200",
};

const STATUS_PILL = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  denied: "bg-stone-100 text-stone-500 border-stone-200",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "learner", label: "Learners" },
  { id: "trainer", label: "Trainers" },
  { id: "admin", label: "Admins" },
  { id: "pending", label: "Pending approval" },
];

function UserFormModal({ onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", department: "", role: "learner" });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    // Admin-created accounts are approved immediately, regardless of role —
    // the approval step only applies to trainers who self-signed-up.
    dispatch(addUser({ ...form, status: "approved" }));
    dispatch(pushToast({ type: "success", message: `${form.name} was added as a ${form.role}.` }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-in items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Add a user</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Full name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              placeholder="e.g. Kofi Adu"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Department</label>
            <input
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="e.g. Finance"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Role</label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm capitalize outline-none focus:border-brand-600"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Add user
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsers({ onMenuClick }) {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const pendingCount = users.filter((u) => u.status === "pending").length;

  const filtered = useMemo(() => {
    if (filter === "all") return users;
    if (filter === "pending") return users.filter((u) => u.status === "pending");
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const handleStatusChange = (user, status) => {
    dispatch(setUserStatus({ userId: user.id, status }));
    dispatch(
      pushToast({
        type: status === "approved" ? "success" : "info",
        message: `${user.name} was ${status === "approved" ? "approved" : "denied"}.`,
      })
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Users" subtitle={`${users.length} people in the system`} onMenuClick={onMenuClick} />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`relative rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {f.label}
                {f.id === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={14} /> Add user
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((u) => {
                const status = u.status || "approved";
                return (
                  <tr key={u.id}>
                    <td className="flex items-center gap-2.5 px-4 py-3">
                      <img src={u.avatarUrl} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
                      <span className="font-semibold text-stone-800">{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{u.department}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${ROLE_PILL[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_PILL[status]}`}>
                        {status === "pending" && <Clock size={10} />}
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role === "trainer" && status === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(u, "approved")}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check size={11} /> Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(u, "denied")}
                            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                          >
                            <Ban size={11} /> Deny
                          </button>
                        </div>
                      )}
                      {u.role === "trainer" && status === "denied" && (
                        <button
                          onClick={() => handleStatusChange(u, "approved")}
                          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                        >
                          <Check size={11} /> Approve anyway
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-4 text-center text-xs text-stone-400">No users match this filter.</p>}
        </div>
      </div>

      {showForm && <UserFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
