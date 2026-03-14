import api from "./api";

const thirdsService = {
  getAll: async () => {
    const { data } = await api.get("/thirds");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/thirds/${id}`);
    return data;
  },
  create: async (thirdData) => {
    const { data } = await api.post("/thirds", thirdData);
    return data;
  },
  update: async (id, thirdData) => {
    const { data } = await api.put(`/thirds/${id}`, thirdData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/thirds/${id}`);
    return data;
  },
};

export default thirdsService;
