import api from "./api";

const quotationsService = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/quotations", { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/quotations/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/quotations", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/quotations/${id}`, payload);
    return data;
  },
  send: async (id) => {
    const { data } = await api.patch(`/quotations/${id}/send`);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/quotations/${id}`);
    return data;
  },
};

export default quotationsService;
