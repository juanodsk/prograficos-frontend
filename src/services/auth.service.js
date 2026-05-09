import api from "./api";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
const logoutUrl = `${apiBaseUrl.replace(/\/$/, "")}/auth/logout`;

const authService = {
  login: async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return data;
  },

  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
  },

  logoutOnPageUnload: () => {
    if (typeof window === "undefined") return;

    try {
      window.fetch(logoutUrl, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        body: "",
      });
    } catch {
      // El navegador puede cancelar esta llamada al cerrar la pestaña.
    }
  },

  profile: async () => {
    const { data } = await api.get("/auth/profile");
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  },
};

export default authService;
