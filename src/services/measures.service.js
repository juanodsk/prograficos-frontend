import api from "./api";

const measuresService = {
  getAll: async () => {
    const { data } = await api.get("/measures");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/measures/${id}`);
    return data;
  },
  create: async (measuresData) => {
    const { data } = await api.post("/measures", measuresData);
    return data;
  },
  update: async (id, measuresData) => {
    const { data } = await api.put(`/measures/${id}`, measuresData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/measures/${id}`);
    return data;
  },
};

export default measuresService;
