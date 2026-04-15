import api from "./api";

const troquelesService = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/troqueles", { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/troqueles/${id}`);
    return data;
  },
  create: async (troquelesData) => {
    const { data } = await api.post("/troqueles", troquelesData);
    return data;
  },
  update: async (id, troquelesData) => {
    const { data } = await api.put(`/troqueles/${id}`, troquelesData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/troqueles/${id}`);
    return data;
  },
};

export default troquelesService;
