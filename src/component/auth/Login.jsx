import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiLock,
  FiMail,
  FiShield,
  FiZap,
} from "react-icons/fi";

import useAuth from "../hooks/useAuth";
import GoogleSignIn from "../auth/GoogleSignIn";

const getLoginErrorMessage = (err) => {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please try again.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";

    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups and try again.";

    default:
      return "Unable to sign in. Please try again.";
  }
};

const Login = () => {
  const { user, loading, userLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect users who already have an active Firebase session.
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Firebase email/password authentication.
      // AuthProvider should apply the rememberMe persistence preference.
      await userLogin(email, formData.password, formData.rememberMe);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async () => {
    // GoogleSignIn has already authenticated with Firebase.
    navigate("/dashboard", { replace: true });
  };

  const handleGoogleError = (err) => {
    setError(getLoginErrorMessage(err));
  };

  const isBusy = loading || isSubmitting;

  return (
    <main className="min-h-screen bg-base-100 text-base-content">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left: brand and product preview */}
        <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col xl:px-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:28px_28px]" />
          </div>

          <Link
            to="/"
            className="relative z-10 inline-flex w-fit items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/25">
              <FiLayers className="text-xl" />
            </span>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </Link>

          <div className="relative z-10 my-auto max-w-xl py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-violet-200">
              <FiZap />
              Your workspace, ready when you are
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Welcome back.
              <span className="block bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Let’s make progress.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Pick up where your team left off. Your projects, tasks, and
              priorities are right where you need them.
            </p>

            {/* Decorative dashboard preview */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Your week at a glance</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Product team workspace
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  In focus
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-slate-900/80 p-4">
                  <p className="text-xs text-slate-400">Tasks completed</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-2xl font-semibold">24</span>
                    <span className="pb-1 text-xs text-emerald-300">
                      +6 this week
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-3/4 rounded-full bg-violet-400" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-slate-900/80 p-4">
                  <p className="text-xs text-slate-400">Project progress</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-2xl font-semibold">78%</span>
                    <span className="pb-1 text-xs text-slate-400">
                      On schedule
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-900/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-300">
                    Today’s priorities
                  </p>
                  <span className="text-xs text-slate-500">3 tasks</span>
                </div>

                {[
                  "Review sprint planning",
                  "Share design feedback",
                  "Prepare project update",
                ].map((task, index) => (
                  <div
                    key={task}
                    className="mt-3 flex items-center gap-3 text-xs text-slate-300"
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        index === 0
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                          : "border-slate-600 text-transparent"
                      }`}
                    >
                      {index === 0 && <FiCheck className="text-[10px]" />}
                    </span>
                    <span
                      className={
                        index === 0 ? "text-slate-500 line-through" : ""
                      }
                    >
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-emerald-300" />
                Stay aligned
              </span>
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-emerald-300" />
                Keep work moving
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span>© {new Date().getFullYear()} TaskFlow</span>
            <span className="inline-flex items-center gap-2">
              <FiShield />
              Your work, organized
            </span>
          </div>
        </section>

        {/* Right: login form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
                  <FiLayers className="text-lg" />
                </span>
                <span className="text-lg font-bold">TaskFlow</span>
              </Link>

              <Link
                to="/register"
                className="text-sm font-medium text-base-content/70 transition hover:text-primary"
              >
                Create account
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-primary">
                WELCOME BACK
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sign in to TaskFlow
              </h2>
              <p className="mt-3 text-sm leading-6 text-base-content/60">
                Enter your account details to access your workspace.
              </p>
            </div>

            <GoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={isBusy}
              label="Continue with Google"
            />

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-base-300" />
              <span className="text-xs font-medium text-base-content/40">
                OR SIGN IN WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-base-300" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={updateField}
                    required
                    disabled={isBusy}
                    className="input input-bordered h-12 w-full pl-10 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary transition hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={updateField}
                    required
                    disabled={isBusy}
                    className="input input-bordered h-12 w-full pl-10 pr-12 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-base-content/50 transition hover:text-base-content"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-base-content/70">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={updateField}
                  disabled={isBusy}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                Remember me on this device
              </label>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-error/20 bg-error/10 px-3.5 py-3 text-sm text-error"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="btn btn-primary h-12 w-full gap-2 normal-case shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-base-content/60">
              New to TaskFlow?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary transition hover:underline"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-base-content/40">
              Sign in only on a device you trust. If you’re using a shared
              computer, remember to sign out when you’re finished.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
