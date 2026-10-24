import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useEffect, useMemo, useState } from "react";
import auth from "../auth/firebase.config";

export const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRegister = async (name, email, password) => {
    setError(null);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      return credential;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const userLogin = async (email, password) => {
    setError(null);

    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const userGoogleLogin = async () => {
    setError(null);

    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const userLogOut = async () => {
    setError(null);

    try {
      await signOut(auth);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

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
    }),
    [user, loading, error],
  );

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
