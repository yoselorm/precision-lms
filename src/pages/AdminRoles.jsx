import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { KeyRound, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "../components/Header";
import ModalOverlay from "../components/ModalOverlay";
import { useConfirm } from "../components/ConfirmDialog";
import { pushToast } from "../store/slices/uiSlice";
import * as adminApi from "../api/admin";

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600";

// The app depends on these by name (account types and the seeded super
// admin), so they can't be renamed or deleted here.
const BUILT_IN = ["learner", "trainer", "super-admin"];

const GUARD_META = {
  admin: { label: "Admin roles", hint: "Grant admin accounts access to parts of the admin area." },
  user: { label: "Learner & trainer roles", hint: "Account types for learners and trainers." },
};

const pretty = (permission) => permission.replace(/-/g, " ");

function RoleFormModal({ role, permissions, onClose, onSaved }) {
  const dispatch = useDispatch();
  const builtIn = !!role && BUILT_IN.includes(role.name);
  const [name, setName] = useState(role?.name || "");
  const [guardName, setGuardName] = useState(role?.guard_name || "admin");
  const [selected, setSelected] = useState(role?.permissions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const available = permissions.filter((p) => p.guard_name === guardName);
  const toggle = (perm) => setSelected((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      // Only permissions that exist for the chosen guard are valid.
      const body = { name: name.trim(), guardName, permissions: selected.filter((p) => available.some((a) => a.name === p)) };
      if (role) await adminApi.updateRole(role.id, body);
      else await adminApi.createRole(body);
      dispatch(pushToast({ type: "success", message: role ? `Role "${body.name}" saved.` : `Role "${body.name}" created.` }));
      onSaved();
    } catch (err) {
      setError(err.message || "Couldn't save the role.");
      setSaving(false);
    }
  };

  return (
    <ModalOverlay>
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">{role ? "Edit role" : "Create a role"}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Role name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={builtIn}
              required
              placeholder="e.g. course-reviewer"
              className={`${inputClass} disabled:bg-stone-50 disabled:text-stone-400`}
            />
            {builtIn && <p className="mt-1 text-[11px] text-stone-400">Built-in roles can't be renamed.</p>}
          </div>

          {!role && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">Applies to</label>
              <div className="flex gap-2">
                {["admin", "user"].map((guard) => (
                  <button
                    type="button"
                    key={guard}
                    onClick={() => setGuardName(guard)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      guardName === guard ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {guard === "admin" ? "Admin accounts" : "Learners & trainers"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">Permissions ({selected.length} selected)</label>
            {available.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-xs text-stone-400">
                There are no permissions for {guardName === "admin" ? "admin accounts" : "learners and trainers"} yet.
              </p>
            ) : (
              <div className="space-y-1 rounded-lg border border-stone-200 p-2">
                {available.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs capitalize text-stone-700 hover:bg-stone-50">
                    <input type="checkbox" checked={selected.includes(p.name)} onChange={() => toggle(p.name)} className="text-brand-700" />
                    {pretty(p.name)}
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : role ? "Save role" : "Create role"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// Admin roles and the permissions each grants (GET/POST/PUT/DELETE
// /admin/roles). Needs the manage-admins permission.
export default function AdminRoles({ onMenuClick }) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState(null); // { role: role | null }

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([adminApi.listRoles(), adminApi.listPermissions()]);
      setRoles(r);
      setPermissions(p);
      setStatus("ready");
    } catch (err) {
      setLoadError(err.message || "Couldn't load roles.");
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (role) => {
    const ok = await confirm({
      title: `Delete the "${role.name}" role?`,
      message: "Anyone who has this role loses the permissions it grants.",
      confirmLabel: "Delete role",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await adminApi.deleteRole(role.id);
      dispatch(pushToast({ type: "success", message: `Role "${role.name}" deleted.` }));
      load();
    } catch (err) {
      dispatch(pushToast({ type: "error", message: err.message || "Couldn't delete the role." }));
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="Roles & permissions" subtitle="Control what each kind of account can do." onMenuClick={onMenuClick} />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <button
            onClick={() => setEditor({ role: null })}
            disabled={status !== "ready"}
            className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            <Plus size={14} /> Create role
          </button>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white p-10 text-sm text-stone-400">
            <Loader2 size={16} className="animate-spin" /> Loading roles...
          </div>
        )}
        {status === "failed" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">{loadError}</div>
        )}

        {status === "ready" &&
          ["admin", "user"].map((guard) => {
            const group = roles.filter((r) => r.guard_name === guard);
            return (
              <div key={guard} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="border-b border-stone-100 px-5 py-3">
                  <p className="text-sm font-bold text-stone-800">{GUARD_META[guard].label}</p>
                  <p className="text-[11px] text-stone-400">{GUARD_META[guard].hint}</p>
                </div>
                {group.length === 0 ? (
                  <p className="p-5 text-xs text-stone-400">No roles yet.</p>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {group.map((role) => {
                      const builtIn = BUILT_IN.includes(role.name);
                      return (
                        <li key={role.id} className="flex items-start gap-3 px-5 py-3">
                          <KeyRound size={15} className="mt-0.5 shrink-0 text-stone-400" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
                              {role.name}
                              {builtIn && (
                                <span className="flex items-center gap-0.5 rounded-full border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[9px] font-bold text-stone-500">
                                  <Lock size={9} /> built-in
                                </span>
                              )}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {role.permissions.length === 0 ? (
                                <span className="text-[11px] text-stone-400">No permissions</span>
                              ) : (
                                role.permissions.map((p) => (
                                  <span key={p} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-brand-800">
                                    {pretty(p)}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              onClick={() => setEditor({ role })}
                              title="Edit"
                              className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                            >
                              <Pencil size={14} />
                            </button>
                            {!builtIn && (
                              <button
                                onClick={() => handleDelete(role)}
                                title="Delete"
                                className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
      </div>

      {editor && (
        <RoleFormModal
          role={editor.role}
          permissions={permissions}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            load();
          }}
        />
      )}
    </div>
  );
}
