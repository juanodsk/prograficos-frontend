import api from "./api";

const authService = {
  login: async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return data;
  },

  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
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
