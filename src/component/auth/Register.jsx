import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiLayers,
  FiZap,
  FiShield,
  FiCircle,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const passwordIsStrong = (password) => {
    return (
      password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const { fullName, email, password, confirmPassword, agreeToTerms } =
      formData;

    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!passwordIsStrong(password)) {
      setError("Use at least 8 characters, including a letter and a number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Connect your backend registration endpoint here.
      // Example:
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fullName, email, password }),
      // });
      //
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || "Registration failed");

      console.info("Registration form is valid:", {
        fullName,
        email,
        // Do not log passwords in a real application.
      });

      // Change this to the route your app uses after successful signup.
      // Keep this navigation after your API confirms registration.
      // navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Start Google OAuth using your authentication provider.
    setError("Google signup is not connected yet.");
  };

  return (
    <main className="min-h-screen bg-base-100 text-base-content">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left: brand and product story */}
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
              <FiZap />A clearer way to work together
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Bring your team's
              <span className="block bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                best work to life.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Plan projects, organize tasks, and keep everyone moving in the
              same direction—all in one collaborative workspace.
            </p>

            {/* Decorative product preview */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold">Website redesign</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Workspace · Product team
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  On track
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4">
                {[
                  {
                    title: "To do",
                    count: "03",
                    tasks: ["Research", "Wireframes"],
                    color: "bg-slate-400",
                  },
                  {
                    title: "In progress",
                    count: "02",
                    tasks: ["Landing page", "Design system"],
                    color: "bg-violet-400",
                  },
                  {
                    title: "Done",
                    count: "08",
                    tasks: ["Kickoff", "Project brief"],
                    color: "bg-emerald-400",
                  },
                ].map((column) => (
                  <div
                    key={column.title}
                    className="rounded-xl bg-slate-900/80 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-slate-300">
                        {column.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {column.count}
                      </span>
                    </div>

                    {column.tasks.map((task) => (
                      <div
                        key={task}
                        className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.04] p-2"
                      >
                        <div
                          className={`mb-2 h-1 w-5 rounded-full ${column.color}`}
                        />
                        <p className="text-[10px] leading-4 text-slate-300">
                          {task}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <FiCircle className="text-[9px] text-slate-500" />
                          <span className="text-[9px] text-slate-500">
                            Task
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5">
                <div className="flex -space-x-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900 bg-amber-300 text-[10px] font-bold text-slate-900">
                    JD
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900 bg-sky-300 text-[10px] font-bold text-slate-900">
                    AM
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900 bg-pink-300 text-[10px] font-bold text-slate-900">
                    SK
                  </span>
                </div>
                <p className="text-xs text-slate-400">Your team, in sync</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-emerald-300" />
                Simple project planning
              </span>
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-emerald-300" />
                One shared workspace
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span>© {new Date().getFullYear()} TaskFlow</span>
            <span className="inline-flex items-center gap-2">
              <FiShield />
              Built for teams
            </span>
          </div>
        </section>

        {/* Right: registration form */}
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
                to="/login"
                className="text-sm font-medium text-base-content/70 transition hover:text-primary"
              >
                Sign in
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-primary">
                GET STARTED FOR FREE
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-base-content/60">
                Start organizing your projects and bringing your team together.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              className="btn btn-outline h-12 w-full border-base-300 bg-base-100 normal-case hover:bg-base-200"
            >
              <FaGoogle className="text-base" />
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-base-300" />
              <span className="text-xs font-medium text-base-content/40">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-base-300" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={formData.fullName}
                    onChange={updateField}
                    required
                    className="input input-bordered h-12 w-full pl-10 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Work email
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    value={formData.email}
                    onChange={updateField}
                    required
                    className="input input-bordered h-12 w-full pl-10 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={updateField}
                    required
                    minLength={8}
                    className="input input-bordered h-12 w-full pl-10 pr-12 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-base-content/50 transition hover:text-base-content"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-base-content/50">
                  Use 8+ characters with at least one letter and one number.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={updateField}
                    required
                    className="input input-bordered h-12 w-full pl-10 pr-12 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    onClick={() => setShowConfirmPassword((shown) => !shown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-base-content/50 transition hover:text-base-content"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm text-base-content/70">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={updateField}
                  className="checkbox checkbox-primary checkbox-sm mt-0.5"
                />
                <span className="leading-5">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-medium text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-medium text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-error/20 bg-error/10 px-3.5 py-3 text-sm text-error"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary h-12 w-full gap-2 normal-case shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-base-content/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary transition hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-base-content/40">
              By creating an account, you can start managing your projects with
              TaskFlow. Your account will be created after the server
              successfully verifies your registration.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
