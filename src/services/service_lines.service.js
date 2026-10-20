import api from "./api";

const serviceLinesService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/service-lines", {
      params: options.onlyActive ? { onlyActive: true } : undefined,
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/service-lines/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/service-lines", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/service-lines/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/service-lines/${id}`);
    return data;
  },
};

export default serviceLinesService;
