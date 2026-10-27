import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import {
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";

import useAuth from "../hooks/useAuth";

const getAuthErrorMessage = (error) => {
  if (error?.code === "auth/email-already-in-use") {
    return "This email is already registered. Please log in.";
  }

  if (error?.code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (error?.code === "auth/weak-password") {
    return "Your password is too weak. Please use a stronger password.";
  }

  if (error?.code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled.";
  }

  if (error?.code === "auth/popup-blocked") {
    return "Your browser blocked the Google sign-in popup.";
  }

  if (error?.code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection.";
  }

  if (error?.status === 401) {
    return "Authentication failed. Please sign in again.";
  }

  if (error?.status === 403) {
    return "You are not allowed to perform this action.";
  }

  if (error?.status === 404) {
    return error?.message || "Your user profile was not found on the server.";
  }

  if (error?.status >= 500) {
    return "The server encountered an error. Please try again later.";
  }

  return error?.message || "Registration failed. Please try again.";
};

const Register = () => {
  const navigate = useNavigate();

  const {
    userRegister,
    userGoogleLogin,
    syncUserProfile,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || authLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();

    if (!fullName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    let firebaseAccountCreated = false;

    try {
      // Step 1: Create the Firebase account.
      const credential = await userRegister(fullName, email, formData.password);

      firebaseAccountCreated = true;

      // Step 2: Sync the Firebase user with MongoDB once.
      await syncUserProfile(credential.user, {
        name: fullName,
        photoURL: credential.user.photoURL || "",
      });

      // Step 3: Continue to onboarding.
      navigate("/onboarding", { replace: true });
    } catch (error) {
      if (firebaseAccountCreated) {
        setErrorMessage(
          "Your Firebase account was created, but your profile could not be saved to the server. Please retry the profile sync or sign in again.",
        );
      } else {
        setErrorMessage(getAuthErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (submitting || authLoading) return;

    setErrorMessage("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      // Step 1: Sign in or register through Google/Firebase.
      const credential = await userGoogleLogin();
      const firebaseUser = credential.user;

      // Step 2: Create or update the MongoDB profile.
      await syncUserProfile(firebaseUser, {
        name: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
      });

      // Step 3: Continue to onboarding.
      navigate("/onboarding", { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || authLoading;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold"
          >
            <span className="rounded-lg bg-indigo-600 px-3 py-2">TF</span>
            <span>TaskFlow</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold">Create your account</h1>

          <p className="mt-2 text-sm text-slate-400">
            Start managing your projects with TaskFlow.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <p
              role="status"
              className="mb-5 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300"
            >
              {successMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isBusy}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-medium transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaGoogle />
            {submitting ? "Please wait..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs uppercase text-slate-500">
              Or register with email
            </span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Full name
              </label>

              <div className="relative">
                <FiUser
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={isBusy}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <div className="relative">
                <FiMail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  disabled={isBusy}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  disabled={isBusy}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-12 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm password
              </label>

              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  disabled={isBusy}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-12 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Log in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          By creating an account, you agree to the terms of service and privacy
          policy.
        </p>
      </div>
    </main>
  );
};

export default Register;
