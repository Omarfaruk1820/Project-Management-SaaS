import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

const getGoogleAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled. Please try again.";

    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Please allow popups.";

    case "auth/cancelled-popup-request":
      return "A Google sign-in request is already in progress.";

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another sign-in method.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";

    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase authentication.";

    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled in Firebase Authentication.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";

    default:
      return "Google sign-in failed. Please try again.";
  }
};

const GoogleSignIn = ({
  onSuccess,
  onError,
  onStart,
  onFinally,
  disabled = false,
  label = "Continue with Google",
  className = "",
}) => {
  const { userGoogleLogin, syncUserProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleGoogleSignIn = async () => {
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    setLocalError("");

    try {
      onStart?.();

      // Step 1: Sign in or register with Google through Firebase.
      const credential = await userGoogleLogin();
      const firebaseUser = credential?.user;

      if (!firebaseUser) {
        throw new Error("Google authentication did not return a user.");
      }

      // Step 2: Synchronize the authenticated user with MongoDB.
      // Pass the Firebase user in case your method accepts it.
      const profile = await syncUserProfile(firebaseUser);

      // Step 3: Resolve the user's display name and email.
      const userName =
        profile?.name ||
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0] ||
        "there";

      // Step 4: Notify the user only after authentication and sync succeed.
      toast.success(`Welcome, ${userName}!`);

      // Step 5: Let Login.jsx handle navigation to the home page.
      await onSuccess?.({
        ...credential,
        profile,
      });
    } catch (error) {
      const message = getGoogleAuthErrorMessage(error);

      if (onError) {
        // The parent handles the error message and toast.
        onError(error);
      } else {
        setLocalError(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
      onFinally?.();
    }
  };

  const isBusy = disabled || isSubmitting;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isBusy}
        aria-busy={isSubmitting}
        className={`btn btn-outline h-12 min-h-12 w-full border-base-300 bg-base-100 normal-case hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isSubmitting ? (
          <span
            className="loading loading-spinner loading-sm"
            aria-hidden="true"
          />
        ) : (
          <FaGoogle className="text-base" aria-hidden="true" />
        )}

        <span>{isSubmitting ? "Connecting to Google..." : label}</span>
      </button>

      {localError && (
        <p role="alert" aria-live="polite" className="mt-2 text-sm text-error">
          {localError}
        </p>
      )}
    </div>
  );
};

export default GoogleSignIn;
