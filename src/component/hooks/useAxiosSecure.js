import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "./useAuth"; // Adjust path if needed

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const useAxiosSecure = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Add Firebase ID token to secure API requests
    const requestInterceptor = axiosSecure.interceptors.request.use(
      async (config) => {
        if (user) {
          const token = await user.getIdToken();

          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Don't send a stale token after logout
          delete config.headers?.Authorization;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    return () => {
      // Prevent duplicate interceptors after re-render/unmount
      axiosSecure.interceptors.request.eject(requestInterceptor);
    };
  }, [user]);

  return axiosSecure;
};

export default useAxiosSecure;
