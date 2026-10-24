import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { createContext, useEffect, useState } from "react";
import auth from "../auth/firebase.config";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase account তৈরি করে display name সেট করে
  const userRegister = async (name, email, password) => {
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Updated profile-সহ credential ফেরত দাও
      return userCredential;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const userlogin = async (email, password) => {
    setError(null);

    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const userlogOut = async () => {
    setError(null);

    try {
      await signOut(auth);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  useEffect(() => {
    // Firebase-এর initial session check এবং পরবর্তী auth changes শোনে
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

    // Component unmount হলে listener বন্ধ
    return () => unsubscribe();
  }, []);

  const authInfo = {
    user,
    loading,
    error,
    userRegister,
    userlogin,
    userlogOut,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
