import api from "./api";

const machineryService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/machinery", {
      params: options.onlyActive ? { onlyActive: true } : undefined,
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/machinery/${id}`);
    return data;
  },
  validateReference: async (reference, excludeId) => {
    const { data } = await api.get("/machinery/validate-reference", {
      params: {
        reference,
        ...(excludeId ? { excludeId } : {}),
      },
    });
    return data;
  },
  create: async (machineryData) => {
    const { data } = await api.post("/machinery", machineryData);
    return data;
  },
  update: async (id, machineryData) => {
    const { data } = await api.put(`/machinery/${id}`, machineryData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/machinery/${id}`);
    return data;
  },
};

export default machineryService;
