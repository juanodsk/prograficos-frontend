import api from "./api";

const ordersService = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/order", { params });
    return data;
  },
  getBoard: async () => {
    const { data } = await api.get("/order/board");
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/order/${id}`);
    return data;
  },
  getAudit: async (params = {}) => {
    const { data } = await api.get("/order/audit", { params });
    return data;
  },
  create: async (orderData) => {
    const { data } = await api.post("/order", orderData);
    return data;
  },
  update: async (id, orderData) => {
    const { data } = await api.put(`/order/${id}`, orderData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/order/${id}`);
    return data;
  },
  markAsFinished: async (id) => {
    const { data } = await api.patch(`/order/${id}/finish`);
    return data;
  },
};

export default ordersService;
