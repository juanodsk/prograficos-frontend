import api from "./api";

const productCustomerService = {
  getAll: async (options = {}) => {
    const { data } = await api.get("/product_customers", {
      params: options.onlyActive ? { onlyActive: true } : undefined,
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/product_customers/${id}`);
    return data;
  },
  create: async (productData) => {
    const { data } = await api.post("/product_customers", productData);
    return data;
  },
  update: async (id, productData) => {
    const { data } = await api.put(`/product_customers/${id}`, productData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/product_customers/${id}`);
    return data;
  },
};

export default productCustomerService;
