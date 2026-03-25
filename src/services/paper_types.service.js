import api from "./api";

const paperTypesService = {
  getAll: async () => {
    const { data } = await api.get("/paper_types");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/paper_types/${id}`);
    return data;
  },
  create: async (productData) => {
    const { data } = await api.post("/paper_types", productData);
    return data;
  },
  update: async (id, productData) => {
    const { data } = await api.put(`/paper_types/${id}`, productData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/paper_types/${id}`);
    return data;
  },
};

export default paperTypesService;
