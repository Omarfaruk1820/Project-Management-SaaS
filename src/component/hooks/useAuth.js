import { useContext } from "react";
import { AuthContext } from "../auth/AuthProvider";

const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "useAuth must be used inside an AuthProvider. " +
        "Wrap your App with AuthProvider in main.jsx.",
    );
  }

  return context;
};

export default useAuth;
