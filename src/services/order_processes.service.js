import api from "./api";

const orderProcessesService = {
  getByOrder: async (orderId) => {
    const { data } = await api.get(`/order-processes/order/${orderId}`);
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/order-processes/${id}`);
    return data;
  },
  start: async (id, payload) => {
    const { data } = await api.patch(`/order-processes/${id}/start`, payload);
    return data;
  },
  finish: async (id, payload) => {
    const { data } = await api.patch(`/order-processes/${id}/finish`, payload);
    return data;
  },
};

export default orderProcessesService;
