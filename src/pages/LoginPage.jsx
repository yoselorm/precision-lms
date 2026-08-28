import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  Copy,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { login } from "../store/slices/authSlice";
import { selectAllUsers, addUser, selectUserByEmail } from "../store/slices/usersSlice";
import { pushToast } from "../store/slices/uiSlice";

const HERO_IMAGE = "https://picsum.photos/seed/afenet-study-hero/1400/1867";

const ROLE_META = {
  learner: { label: "Learner", icon: BookOpen, color: "#16a34a" },
  admin: { label: "Admin", icon: ShieldCheck, color: "#dc2626" },
  trainer: { label: "Trainer", icon: GraduationCap, color: "#7c3aed" },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Field({ label, action, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function FilledInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border-0 bg-stone-100 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-brand-600"
    />
  );
}

function PasswordField({ label, value, onChange, placeholder, autoComplete, action }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label={label}
      action={
        action ?? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 hover:text-brand-800"
          >
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
            {visible ? "Hide" : "Show"}
          </button>
        )
      }
    >
      <FilledInput
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </Field>
  );
}

function DemoAccountsPanel({ onFill }) {
  const users = useSelector(selectAllUsers);
  const [open, setOpen] = useState(false);

  const representative = ["learner", "trainer", "admin"]
    .map((role) => users.find((u) => u.role === role && (u.status || "approved") === "approved"))
    .filter(Boolean);

  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold text-stone-600 transition hover:text-stone-900"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={13} className="text-brand-700" /> Try a demo account
        </span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-1.5 px-3 pb-3 pt-1">
          {representative.map((u) => {
            const meta = ROLE_META[u.role];
            const Icon = meta.icon;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onFill(u.email, u.password)}
                className="flex w-full items-center gap-2 rounded-lg border border-stone-200/80 bg-white px-2.5 py-1.5 text-left text-xs transition hover:border-brand-500 hover:bg-brand-50/50"
              >
                <Icon size={13} style={{ color: meta.color }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-800">{meta.label}</p>
                  <p className="truncate text-[10px] text-stone-400">{u.email}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600">
                  <Copy size={9} /> Fill
                </span>
              </button>
            );
          })}
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
    await delay(600);

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
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        <Field label="Email Address">
          <FilledInput
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Enter your email..."
            autoComplete="username"
            required
          />
        </Field>

        <PasswordField
          label="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Enter your password..."
          autoComplete="current-password"
        />

        {showForgot && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            Ask your workspace administrator to reset your credentials under <strong>Admin → Users</strong>.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => setShowForgot((v) => !v)}
          className="block w-full text-center text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          Forgot password?
        </button>
      </form>

      <DemoAccountsPanel onFill={(email, password) => setForm({ email, password })} />
    </div>
  );
}

function SignupTab({ onSignedUp }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "learner",
  });
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
    await delay(600);

    const state = dispatch((_, getState) => getState());
    if (selectUserByEmail(state, form.email)) {
      setLoading(false);
      setError("An account with this email already exists.");
      return;
    }

    const action = dispatch(
      addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department || "General",
        role: form.role,
      })
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
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
          <Clock size={20} className="text-amber-600" />
        </div>
        <h2 className="text-sm font-bold text-stone-900">Your trainer account is pending approval</h2>
        <p className="text-xs text-stone-500">
          Thanks for signing up, {form.name.split(" ")[0]}. An admin must approve trainer accounts before you can manage courses.
        </p>
        <button
          onClick={onSignedUp}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          Continue <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
      <Field label="Full Name">
        <FilledInput
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          placeholder="Enter your full name..."
        />
      </Field>

      <Field label="Email Address">
        <FilledInput
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          placeholder="Enter your email..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <PasswordField
          label="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="6+ chars"
        />
        <PasswordField
          label="Confirm"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          placeholder="Repeat"
        />
      </div>

      <Field label="Department">
        <FilledInput
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="e.g. Health Systems"
        />
      </Field>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-stone-700">Role</label>
        <div className="flex gap-2">
          {["learner", "trainer", "admin"].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => update("role", r)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${
                form.role === r ? "bg-brand-700 text-white shadow-2xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Creating account..." : "Create Account"}
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
  const isLogin = tab === "login";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Scrollable Left Form Column */}
      <div className="flex h-full w-full flex-col justify-between overflow-y-auto px-6 py-8 sm:px-10 md:px-14 lg:w-1/2 lg:px-16">
        {/* Top Header */}
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white shadow-xs">
                <GraduationCap size={18} />
              </div>
              <span className="text-base font-extrabold tracking-tight text-stone-900">Afenet LMS</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Workplace learning &amp; development
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-5 flex justify-center gap-8 border-b border-stone-100">
            <button
              onClick={() => setTab("login")}
              className={`-mb-px border-b-2 pb-2.5 text-xs sm:text-sm font-bold transition ${
                isLogin ? "border-brand-700 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`-mb-px border-b-2 pb-2.5 text-xs sm:text-sm font-bold transition ${
                !isLogin ? "border-brand-700 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Title and Body */}
          <div className="mb-5 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              {location.state?.from
                ? "Sign in or create an account to continue enrolling."
                : isLogin
                ? "Sign in to access your courses and dashboard."
                : "Sign up to start your learning journey."}
            </p>
          </div>

          {isLogin ? <LoginTab onLoggedIn={goNext} /> : <SignupTab onSignedUp={goNext} />}
        </div>

        {/* Subtle Footer */}
        <div className="mx-auto mt-6 text-center text-[11px] text-stone-400">
          © {new Date().getFullYear()} Afenet LMS · Secure Authentication
        </div>
      </div>

      {/* Right Hero Image (Static, No Scroll) */}
      <div className="relative hidden h-full lg:block lg:w-1/2">
        <img src={HERO_IMAGE} alt="Afenet learning environment" className="h-full w-full object-cover select-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>
    </div>
  );
}