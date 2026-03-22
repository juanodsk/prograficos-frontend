import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401 && !url.includes("/auth/login")) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    if (status === 403 && !url.includes("/auth/login")) {
      window.location.href = "/unauthorized";
    }

    return Promise.reject(error);
  },
);

export default api;
