import api from "./api";

const processesService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/processes", {
      params: options.onlyActive ? { onlyActive: true } : undefined,
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/processes/${id}`);
    return data;
  },
  create: async (processData) => {
    const { data } = await api.post("/processes", processData);
    return data;
  },
  update: async (id, processData) => {
    const { data } = await api.put(`/processes/${id}`, processData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/processes/${id}`);
    return data;
  },
};

export default processesService;
