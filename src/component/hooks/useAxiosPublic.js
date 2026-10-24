// useAxiosPublic.js — example setup
import axios from "axios";

const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const useAxiosPublic = () => axiosPublic;

export default useAxiosPublic;
