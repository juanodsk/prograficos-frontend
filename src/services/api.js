import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: true,
});

// Interceptor request - se ejecuta antes de cada petición
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor response - se ejecuta después de cada respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expirado o no autorizado - cerrar sesión
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    if (status === 403) {
      // Sin permisos
      window.location.href = "/unauthorized";
    }

    return Promise.reject(error);
  },
);

export default api;
