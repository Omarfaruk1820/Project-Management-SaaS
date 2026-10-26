import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiLock,
  FiMail,
  FiUser,
  FiZap,
} from "react-icons/fi";

import useAuth from "../hooks/useAuth";
import GoogleSignIn from "../auth/GoogleSignIn";

const getAuthErrorMessage = (err, accountCreated = false) => {
  if (accountCreated && err?.status === 401) {
    return "Firebase account তৈরি হয়েছে, কিন্তু authentication token গ্রহণ করা হয়নি। আবার login করে চেষ্টা করো।";
  }

  if (accountCreated) {
    return "Firebase account তৈরি হয়েছে, কিন্তু MongoDB-তে profile save হয়নি। আবার login করে profile sync করার চেষ্টা করো।";
  }

  switch (err?.code) {
    case "auth/email-already-in-use":
      return "এই email দিয়ে account আগে থেকেই আছে। Login করো.";

    case "auth/invalid-email":
      return "সঠিক email address দাও।";

    case "auth/weak-password":
      return "আরও শক্তিশালী password ব্যবহার করো।";

    case "auth/network-request-failed":
      return "Network connection check করে আবার চেষ্টা করো।";

    case "auth/operation-not-allowed":
      return "Firebase Console-এ এই sign-in method enable করা নেই।";

    case "auth/too-many-requests":
      return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করো।";

    case "auth/invalid-credential":
      return "Login information সঠিক নয় অথবা মেয়াদ শেষ হয়েছে। আবার চেষ্টা করো।";

    default:
      if (err?.status === 401) {
        return "Authentication token invalid বা expired। আবার login করে চেষ্টা করো।";
      }

      if (err?.status === 403) {
        return "এই account ব্যবহার করার অনুমতি নেই।";
      }

      if (err?.status === 404) {
        return "Profile API পাওয়া যায়নি। Backend route configuration পরীক্ষা করো।";
      }

      if (err?.status >= 500) {
        return "Server-এ সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করো।";
      }

      return err?.message || "Registration ব্যর্থ হয়েছে। আবার চেষ্টা করো।";
  }
};

const isPasswordStrong = (password) =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

const Register = () => {
  const navigate = useNavigate();

  const { userRegister, syncUserProfile, loading: authLoading } = useAuth();

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

  const busy = authLoading || isSubmitting;

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const validateForm = () => {
    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const { password, confirmPassword, agreeToTerms } = formData;

    if (!fullName) {
      return "তোমার নাম লিখো।";
    }

    if (fullName.length > 100) {
      return "নাম ১০০ অক্ষরের মধ্যে রাখো।";
    }

    if (!email) {
      return "Email address লিখো।";
    }

    if (password.length > 128) {
      return "Password ১২৮ অক্ষরের মধ্যে রাখো।";
    }

    if (!isPasswordStrong(password)) {
      return "Password অন্তত ৮ অক্ষরের হতে হবে এবং letter ও number থাকতে হবে।";
    }

    if (password !== confirmPassword) {
      return "দুটি password মিলছে না।";
    }

    if (!agreeToTerms) {
      return "Terms of Service এবং Privacy Policy accept করো।";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy) return;

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    let firebaseAccountCreated = false;

    try {
      // 1. Create the Firebase account.
      const credential = await userRegister(
        formData.fullName.trim(),
        formData.email.trim(),
        formData.password,
      );

      firebaseAccountCreated = true;

      // 2. Save the profile in MongoDB.
      await syncUserProfile(credential.user, {
        name: formData.fullName.trim(),
        photoURL: credential.user.photoURL || "",
      });

      // 3. Navigate only after the profile sync succeeds.
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error("Registration failed:", {
        code: err?.code,
        status: err?.status,
        message: err?.message,
      });

      setError(getAuthErrorMessage(err, firebaseAccountCreated));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    if (busy) return;

    setError("");
    setIsSubmitting(true);

    let firebaseAccountCreated = false;

    try {
      const firebaseUser = credential?.user;

      if (!firebaseUser) {
        throw new Error("Google sign-in did not return a Firebase user.");
      }

      // Firebase has authenticated the user.
      firebaseAccountCreated = true;

      // Sync the Firebase profile with MongoDB.
      await syncUserProfile(firebaseUser, {
        name: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
      });

      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error("Google profile sync failed:", {
        code: err?.code,
        status: err?.status,
        message: err?.message,
      });

      setError(getAuthErrorMessage(err, firebaseAccountCreated));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-100 text-base-content">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col xl:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:28px_28px]" />
          </div>

          <Link
            to="/"
            className="relative z-10 inline-flex w-fit items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500">
              <FiLayers className="text-xl" />
            </span>

            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </Link>

          <div className="relative z-10 my-auto max-w-xl py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-violet-200">
              <FiZap aria-hidden="true" />A clearer way to work together
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Bring your team&apos;s
              <span className="block bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                best work to life.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Plan projects, organize tasks, and keep your team moving in one
              collaborative workspace.
            </p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold">Website redesign</p>

                  <p className="mt-1 text-xs text-slate-400">
                    Workspace · Product team
                  </p>
                </div>

                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                  On track
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  {
                    title: "To do",
                    tasks: ["Research", "Wireframes"],
                  },
                  {
                    title: "In progress",
                    tasks: ["Landing page", "Design system"],
                  },
                  {
                    title: "Done",
                    tasks: ["Kickoff", "Project brief"],
                  },
                ].map((column) => (
                  <div
                    key={column.title}
                    className="rounded-xl bg-slate-900/80 p-3"
                  >
                    <p className="mb-3 text-[11px] font-medium text-slate-300">
                      {column.title}
                    </p>

                    {column.tasks.map((task) => (
                      <div
                        key={task}
                        className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 text-[10px] text-slate-300"
                      >
                        {task}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500">
            © {new Date().getFullYear()} TaskFlow · Work, organized.
          </p>
        </section>

        {/* Registration form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
                  <FiLayers aria-hidden="true" />
                </span>

                <span className="text-lg font-bold">TaskFlow</span>
              </Link>

              <Link to="/login" className="text-sm font-medium text-primary">
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

            <GoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={() => setError("")}
              disabled={busy}
              label="Continue with Google"
            />

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-base-300" />

              <span className="text-xs font-medium text-base-content/40">
                OR SIGN UP WITH EMAIL
              </span>

              <div className="h-px flex-1 bg-base-300" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>

                <div className="relative">
                  <FiUser
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={formData.fullName}
                    onChange={updateField}
                    required
                    maxLength={100}
                    disabled={busy}
                    className="input input-bordered h-12 w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <div className="relative">
                  <FiMail
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    value={formData.email}
                    onChange={updateField}
                    required
                    maxLength={254}
                    disabled={busy}
                    className="input input-bordered h-12 w-full pl-10"
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
                  <FiLock
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />

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
                    maxLength={128}
                    disabled={busy}
                    className="input input-bordered h-12 w-full pl-10 pr-12"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((shown) => !shown)}
                    disabled={busy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-base-content/50"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-base-content/50">
                  8+ characters, including a letter and a number.
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
                  <FiLock
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={updateField}
                    required
                    maxLength={128}
                    disabled={busy}
                    className="input input-bordered h-12 w-full pl-10 pr-12"
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((shown) => !shown)}
                    disabled={busy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-base-content/50"
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
                  disabled={busy}
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
                  aria-live="polite"
                  className="alert alert-error text-sm"
                >
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary h-12 w-full gap-2 normal-case"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-base-content/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
