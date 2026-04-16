import api from "./api";

const productsService = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/products", { params });
    return data;
  },
  searchByCustomer: async (customer, params = {}) => {
    const { data } = await api.get("/products", {
      params: {
        customer,
        onlyActive: true,
        page: 1,
        pageSize: 1000,
        sortBy: "name",
        sortDirection: "asc",
        ...params,
      },
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  create: async (productData) => {
    const { data } = await api.post("/products", productData);
    return data;
  },
  update: async (id, productData) => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

export default productsService;
