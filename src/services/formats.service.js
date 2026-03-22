import api from "./api";

const formatsService = {
  getAll: async () => {
    const { data } = await api.get("/formats");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/formats/${id}`);
    return data;
  },
  create: async (formatsData) => {
    const { data } = await api.post("/formats", formatsData);
    return data;
  },
  update: async (id, formatsData) => {
    const { data } = await api.put(`/formats/${id}`, formatsData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/formats/${id}`);
    return data;
  },
};

export default formatsService;
