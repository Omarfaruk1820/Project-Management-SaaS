import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import auth from "../auth/firebase.config";

export const AuthContext = createContext(null);

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const AUTH_API_URL = `${API_BASE_URL}/api/v1/auth`;
const USERS_API_URL = `${API_BASE_URL}/api/v1/users`;

const googleProvider = new GoogleAuthProvider();

const readResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.code = data?.code;
    error.responseData = data;

    throw error;
  }

  return data;
};

const authenticatedRequest = async (firebaseUser, url, options = {}) => {
  if (!firebaseUser) {
    throw new Error("You must be signed in to perform this request.");
  }

  const idToken = await firebaseUser.getIdToken();

  const headers = new Headers(options.headers || {});

  headers.set("Authorization", `Bearer ${idToken}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return readResponse(response);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Observe Firebase authentication state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
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

  // Register with Firebase only.
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

      setUser(credential.user);

      return credential;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const userLogin = useCallback(async (email, password) => {
    setError(null);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      setUser(credential.user);

      return credential;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const userGoogleLogin = useCallback(async () => {
    setError(null);

    try {
      const credential = await signInWithPopup(auth, googleProvider);

      setUser(credential.user);

      return credential;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Synchronize Firebase user data with MongoDB.
  const syncUserProfile = useCallback(async (firebaseUser, profile = {}) => {
    setError(null);

    try {
      const data = await authenticatedRequest(
        firebaseUser,
        `${USERS_API_URL}/sync`,
        {
          method: "POST",
          body: JSON.stringify({
            name: profile.name?.trim() || firebaseUser.displayName || "",
            photoURL: profile.photoURL ?? firebaseUser.photoURL ?? "",
          }),
        },
      );

      return data.user;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Fetch the signed-in user's MongoDB profile.
  const getCurrentUserProfile = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error("You must be signed in to get your profile.");
    }

    setError(null);

    try {
      const data = await authenticatedRequest(
        firebaseUser,
        `${USERS_API_URL}/me`,
        { method: "GET" },
      );

      return data.user;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Record logout on the server, then always sign out of Firebase.
  const userLogOut = useCallback(async () => {
    setError(null);

    let logoutError = null;
    const firebaseUser = auth.currentUser;

    try {
      if (firebaseUser) {
        await authenticatedRequest(
          firebaseUser,
          `${AUTH_API_URL}/session/logout`,
          { method: "POST" },
        );
      }
    } catch (err) {
      logoutError = err;
      setError(err);
    } finally {
      await signOut(auth);
      setUser(null);
    }

    if (logoutError) {
      throw logoutError;
    }
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
