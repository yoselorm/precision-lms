import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GraduationCap, ShieldCheck, BookOpen, Clock, ArrowRight } from "lucide-react";
import { login } from "../store/slices/authSlice";
import { selectAllUsers, addUser } from "../store/slices/usersSlice";

const ROLE_META = {
  learner: { label: "Learner", icon: BookOpen, color: "#16a34a" },
  admin: { label: "Admin", icon: ShieldCheck, color: "#dc2626" },
  trainer: { label: "Trainer", icon: GraduationCap, color: "#7c3aed" },
};

function DemoLoginTab({ onLoggedIn }) {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const groups = ["admin", "trainer", "learner"];

  const handlePick = (user) => {
    dispatch(login(user));
    onLoggedIn();
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-xs text-stone-400">
        This is a client demo — pick who you'd like to sign in as to preview that person's experience.
      </p>
      {groups.map((role) => {
        const roleUsers = users.filter((u) => u.role === role && (u.status || "approved") === "approved");
        if (roleUsers.length === 0) return null;
        const meta = ROLE_META[role];
        const Icon = meta.icon;
        return (
          <div key={role}>
            <div className="mb-3 flex items-center gap-2">
              <Icon size={14} style={{ color: meta.color }} />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{meta.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roleUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handlePick(u)}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/50"
                >
                  <img src={u.avatarUrl} alt={u.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-800">{u.name}</p>
                    <p className="truncate text-[11px] text-stone-400">{u.department}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignupTab({ onSignedUp }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", email: "", department: "", role: "learner" });
  const [pendingNotice, setPendingNotice] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const action = dispatch(addUser({ name: form.name, department: form.department || "General", role: form.role }));
    const newUser = action.payload;
    dispatch(login(newUser));
    if (newUser.role === "trainer" && newUser.status === "pending") {
      setPendingNotice(true);
      return;
    }
    onSignedUp();
  };

  if (pendingNotice) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <Clock size={22} className="text-amber-600" />
        </div>
        <h2 className="text-base font-bold text-stone-900">Your trainer account is pending approval</h2>
        <p className="max-w-sm text-sm text-stone-500">
          Thanks for signing up, {form.name.split(" ")[0]}. An admin needs to approve trainer accounts before you can
          create classes or manage materials. You're signed in — just with limited access until then.
        </p>
        <button
          onClick={onSignedUp}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Continue <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="mb-1 block text-xs font-semibold text-stone-600">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-stone-600">Department</label>
        <input
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="e.g. Sales"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-stone-600">I'm signing up as a</label>
        <div className="flex gap-2">
          {["learner", "trainer"].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => update("role", r)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition ${
                form.role === r ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {form.role === "trainer" && (
          <p className="mt-1.5 text-[11px] text-amber-700">Trainer accounts need admin approval before you can run classes.</p>
        )}
      </div>
      <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
        Create account
      </button>
      <p className="text-center text-[10px] text-stone-400">Demo signup — no password/verification required.</p>
    </form>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === "signup" ? "signup" : "login");
  const redirectTo = location.state?.from || "/";

  const goNext = () => navigate(redirectTo, { replace: true });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-emerald-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Afenet LMS</h1>
          {location.state?.from && (
            <p className="mt-1 text-xs font-semibold text-brand-700">Sign in or create an account to continue enrolling.</p>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${tab === "login" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
            >
              Log in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${tab === "signup" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
            >
              Sign up
            </button>
          </div>

          <div className={tab === "signup" ? "mx-auto max-w-sm" : ""}>
            {tab === "login" ? <DemoLoginTab onLoggedIn={goNext} /> : <SignupTab onSignedUp={goNext} />}
          </div>
        </div>
      </div>
    </div>
  );
}
