import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Clock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { pushToast } from "../store/slices/uiSlice";
import afenetLogo from "../assets/images/afenet-logo.jpeg";
import authHero from "../assets/images/auth-hero.webp";

function Field({ label, action, children }) {
  return (
    <div className="flex flex-col gap-1.5">
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

function LoginTab({ onLoggedIn, portal }) {
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
    const result = await dispatch(loginUser({ email: form.email.trim(), password: form.password, portal }));
    setLoading(false);

    if (loginUser.rejected.match(result)) {
      setError(result.payload || "Couldn't sign you in. Please try again.");
      return;
    }

    const { user } = result.payload;
    dispatch(pushToast({ type: "success", message: `Welcome back, ${user.name.split(" ")[0]}.` }));
    onLoggedIn();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
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
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const result = await dispatch(
      registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim(),
        role: form.role,
      })
    );
    setLoading(false);

    if (registerUser.rejected.match(result)) {
      setError(result.payload || "Couldn't create your account. Please try again.");
      return;
    }

    const { user, token } = result.payload;
    // No token means the account is a trainer awaiting admin approval.
    if (!token) {
      setPendingNotice(true);
      return;
    }
    dispatch(pushToast({ type: "success", message: `Account created — welcome, ${user.name.split(" ")[0]}.` }));
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
          Thanks for signing up, {form.name.split(" ")[0]}. An admin must approve trainer accounts before you can sign in. You'll be able to log in as soon as you're approved.
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
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="grid grid-cols-2 gap-3">
        <PasswordField
          label="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="8+ chars"
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
        <label className="mb-2 block text-xs font-semibold text-stone-700">Role</label>
        <div className="flex gap-2">
          {["learner", "trainer"].map((r) => (
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

// Two entry points: `/login` for learners and trainers (with sign-up), and
// `/admin/login` (portal="admin") for admins only.
export default function LoginPage({ portal = "user" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPortal = portal === "admin";
  const [tab, setTab] = useState(!isAdminPortal && location.state?.tab === "signup" ? "signup" : "login");
  const redirectTo = location.state?.from || "/";

  const goNext = () => navigate(redirectTo, { replace: true });
  const isLogin = isAdminPortal || tab === "login";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Scrollable Left Form Column */}
      <div className="flex h-full w-full flex-col overflow-y-auto px-6 py-8 sm:px-10 md:px-14 lg:w-1/2 lg:px-16">
        {/* Top Header */}
        <div className="mx-auto my-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-stone-200">
                <img src={afenetLogo} alt="AFENET" className="h-full w-full object-contain p-0.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-stone-900">Afenet LMS</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {isAdminPortal ? "Administration" : "Workplace learning & development"}
            </p>
          </div>

          {/* Navigation Tabs — admins have no sign-up */}
          {isAdminPortal ? (
            <div className="mb-8 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-800">
                <ShieldCheck size={13} /> Admin sign in
              </span>
            </div>
          ) : (
          <div className="mb-8 flex justify-center gap-8 border-b border-stone-100">
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
          )}

          {/* Title and Body */}
          <div className="mb-8 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              {isAdminPortal ? "Admin Portal" : isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="mt-2 text-xs text-stone-500">
              {isAdminPortal
                ? "Sign in with your administrator account."
                : location.state?.from
                ? "Sign in or create an account to continue enrolling."
                : isLogin
                ? "Sign in to access your courses and dashboard."
                : "Sign up to start your learning journey."}
            </p>
          </div>

          {isLogin ? <LoginTab onLoggedIn={goNext} portal={portal} /> : <SignupTab onSignedUp={goNext} />}

          <p className="mt-6 text-center text-[11px] text-stone-400">
            {isAdminPortal ? (
              <>
                Learner or trainer?{" "}
                <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                  Sign in here
                </Link>
              </>
            ) : (
              <>
                Administrator?{" "}
                <Link to="/admin/login" className="font-semibold text-brand-700 hover:underline">
                  Use the admin login
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Subtle Footer */}
        <div className="mx-auto mt-10 text-center text-[11px] text-stone-400">
          © {new Date().getFullYear()} Afenet LMS · Secure Authentication
        </div>
      </div>

      {/* Right Hero Image (Static, No Scroll) */}
      <div className="relative hidden h-full lg:block lg:w-1/2">
        <img src={authHero} alt="Open book and coffee on a study desk" className="h-full w-full object-cover object-[center_65%] select-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>
    </div>
  );
}