import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import useAuth from "../hooks/useAuth";

const GoogleSignIn = ({
  onSuccess,
  onError,
  disabled = false,
  label = "Continue with Google",
}) => {
  const { userGoogleLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleGoogleSignIn = async () => {
    setLocalError("");

    try {
      setIsSubmitting(true);

      const credential = await userGoogleLogin();

      // Parent may sync MongoDB profile and navigate.
      await onSuccess?.(credential);
    } catch (err) {
      const message =
        err?.code === "auth/popup-closed-by-user"
          ? "Google sign-in window was closed."
          : err?.code === "auth/popup-blocked"
            ? "Browser blocked the sign-in popup. Allow popups and retry."
            : err?.message || "Google sign-in failed.";

      setLocalError(message);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disabled || isSubmitting}
        className="btn btn-outline h-12 w-full border-base-300 bg-base-100 normal-case hover:bg-base-200"
      >
        {isSubmitting ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <FaGoogle className="text-base" />
        )}
        {isSubmitting ? "Connecting to Google..." : label}
      </button>

      {localError && (
        <p role="alert" className="mt-2 text-sm text-error">
          {localError}
        </p>
      )}
    </div>
  );
};

export default GoogleSignIn;
