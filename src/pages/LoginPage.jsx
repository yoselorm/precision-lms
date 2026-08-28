import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ChevronDown,
  Copy,
  HelpCircle,
} from "lucide-react";
import { login } from "../store/slices/authSlice";
import { selectAllUsers, addUser, selectUserByEmail } from "../store/slices/usersSlice";
import { pushToast } from "../store/slices/uiSlice";

const ROLE_META = {
  learner: { label: "Learner", icon: BookOpen, color: "#16a34a" },
  admin: { label: "Admin", icon: ShieldCheck, color: "#dc2626" },
  trainer: { label: "Trainer", icon: GraduationCap, color: "#7c3aed" },
};

// Simulates a network round-trip so login/signup feel like they're hitting a
// real service instead of resolving instantly — matched with a spinner on
// the submit button.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function DemoAccountsPanel({ onFill }) {
  const users = useSelector(selectAllUsers);
  const [open, setOpen] = useState(false);

  const representative = ["learner", "trainer", "admin"]
    .map((role) => users.find((u) => u.role === role && (u.status || "approved") === "approved"))
    .filter(Boolean);

  return (
    <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-stone-600"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={13} /> Try a demo account (any role)
        </span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in space-y-1.5 px-3 pb-3">
          {representative.map((u) => {
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onFill(u.email, u.password)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs transition hover:border-brand-500 hover:bg-brand-50/50"
              >
                <Icon size={14} style={{ color: meta.color }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-800">{meta.label}</p>
                  <p className="truncate text-[10px] text-stone-400">{u.email}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-500">
                  <Copy size={10} /> Fill
                </span>
              </button>
            );
          })}
          <p className="pt-1 text-[10px] text-stone-400">Fills the form below — you still need to hit Log in.</p>
        </div>
      )}
    </div>
  );
}

function LoginTab({ onLoggedIn }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Enter both your email and password.");
      return;
    }
    setLoading(true);
    await delay(700);

    // Look up straight from the live users list (not a memoized selector
    // snapshot) so a just-created account can log in immediately.
    const state = dispatch((_, getState) => getState());
    const user = selectUserByEmail(state, form.email);

    if (!user || user.password !== form.password) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    dispatch(login(user));
    dispatch(pushToast({ type: "success", message: `Welcome back, ${user.name.split(" ")[0]}.` }));
    setLoading(false);
    onLoggedIn();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Email</label>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 focus-within:border-brand-600">
            <Mail size={14} className="shrink-0 text-stone-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@afenet.org"
              className="w-full bg-transparent text-sm outline-none"
              autoComplete="username"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-600">Password</label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] font-semibold text-brand-700 hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 focus-within:border-brand-600">
            <Lock size={14} className="shrink-0 text-stone-400" />
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm outline-none"
              autoComplete="current-password"
            />
          </div>
        </div>

        {showForgot && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            There's no email service behind this demo yet — ask your workspace admin to reset your password from{" "}
            <strong>Admin → Users</strong>.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>

      <DemoAccountsPanel onFill={(email, password) => setForm({ email, password })} />
    </div>
  );
}

function SignupTab({ onSignedUp }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", department: "", role: "learner" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    await delay(700);

    const state = dispatch((_, getState) => getState());
    if (selectUserByEmail(state, form.email)) {
      setLoading(false);
      setError("An account with this email already exists.");
      return;
    }

    const action = dispatch(
      addUser({ name: form.name, email: form.email, password: form.password, department: form.department || "General", role: form.role })
    );
    const newUser = action.payload;
    dispatch(login(newUser));
    setLoading(false);

    if (newUser.role === "trainer" && newUser.status === "pending") {
      setPendingNotice(true);
      return;
    }
    dispatch(pushToast({ type: "success", message: `Account created — welcome, ${newUser.name.split(" ")[0]}.` }));
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
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Confirm password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
            placeholder="Repeat password"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
        </div>
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
          {["learner", "trainer", "admin"].map((r) => (
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
        {form.role === "admin" && (
          <p className="mt-1.5 text-[11px] text-stone-400">Admin accounts get full org-wide access — use for internal staff.</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "Creating account..." : "Create account"}
      </button>
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
      <div className="w-full max-w-md">
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

          {tab === "login" ? <LoginTab onLoggedIn={goNext} /> : <SignupTab onSignedUp={goNext} />}
        </div>
      </div>
    </div>
  );
}
