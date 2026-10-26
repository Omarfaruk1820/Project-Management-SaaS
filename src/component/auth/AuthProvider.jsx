import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import auth from "../auth/firebase.config";

export const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const AUTH_API_URL = `${API_BASE_URL}/api/v1/auth`;
const USERS_API_URL = `${API_BASE_URL}/api/v1/users`;

const readResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.message || `Request failed (${response.status}).`,
    );

    error.status = response.status;
    error.code = data?.code || null;
    error.responseData = data;

    throw error;
  }

  return data;
};

const authenticatedRequest = async (firebaseUser, url, options = {}) => {
  if (!firebaseUser) {
    throw new Error("You must be signed in to perform this request.");
  }

  const idToken = await firebaseUser.getIdToken(true);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${idToken}`,
    },
  });

  return readResponse(response);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRegister = useCallback(async (name, email, password) => {
    setError(null);

    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim();

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );

      await updateProfile(credential.user, {
        displayName: cleanName,
      });

      return credential;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const userLogin = useCallback(async (email, password) => {
    setError(null);

    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const userGoogleLogin = useCallback(async () => {
    setError(null);

    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const syncUserProfile = useCallback(async (firebaseUser, profile = {}) => {
    setError(null);

    try {
      if (!firebaseUser?.uid) {
        throw new Error("A signed-in Firebase user is required.");
      }

      const data = await authenticatedRequest(
        firebaseUser,
        `${USERS_API_URL}/sync`,
        {
          method: "POST",
          body: JSON.stringify({
            name: profile.name ?? firebaseUser.displayName ?? "",
            photoURL: profile.photoURL ?? firebaseUser.photoURL ?? "",
          }),
        },
      );

      if (!data?.user) {
        throw new Error("The server did not return the saved user profile.");
      }

      return data.user;
    } catch (err) {
      setError(err);

      console.error("[syncUserProfile] Failed:", {
        status: err.status,
        code: err.code,
        message: err.message,
        responseData: err.responseData,
      });

      throw err;
    }
  }, []);

  const getCurrentUserProfile = useCallback(async () => {
    setError(null);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be signed in to load your profile.");
      }

      const data = await authenticatedRequest(
        currentUser,
        `${USERS_API_URL}/me`,
        {
          method: "GET",
        },
      );

      if (!data?.user) {
        throw new Error("The server did not return your user profile.");
      }

      return data.user;
    } catch (err) {
      setError(err);

      console.error("[getCurrentUserProfile] Failed:", {
        status: err.status,
        code: err.code,
        message: err.message,
        responseData: err.responseData,
      });

      throw err;
    }
  }, []);

  const userLogOut = useCallback(async () => {
    setError(null);

    const currentUser = auth.currentUser;

    try {
      if (currentUser) {
        try {
          await authenticatedRequest(
            currentUser,
            `${AUTH_API_URL}/session/logout`,
            {
              method: "POST",
            },
          );
        } catch (trackingError) {
          console.warn(
            "[userLogOut] Backend logout tracking failed:",
            trackingError.message,
          );
        }
      }
    } finally {
      try {
        await signOut(auth);
      } catch (err) {
        setError(err);
        throw err;
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        setError(authError);
        setUser(null);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const authInfo = useMemo(
    () => ({
      user,
      loading,
      error,
      userRegister,
      userLogin,
      userGoogleLogin,
      userLogOut,
      syncUserProfile,
      getCurrentUserProfile,
    }),
    [
      user,
      loading,
      error,
      userRegister,
      userLogin,
      userGoogleLogin,
      userLogOut,
      syncUserProfile,
      getCurrentUserProfile,
    ],
  );

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
