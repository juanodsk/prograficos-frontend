import api from "./api";

const userService = {
  getUsers: async (params = {}) => {
    const { data } = await api.get("/users", { params });
    return data;
  },
  createUser: async (userData) => {
    const { data } = await api.post("/users/create", userData); // ← /create
    return data;
  },
  updateUser: async (id, userData) => {
    const { data } = await api.put(`/users/update/${id}`, userData); // ← /update/:id
    return data;
  },
  deleteUser: async (id) => {
    const { data } = await api.delete(`/users/delete/${id}`); // ← /delete/:id
    return data;
  },
  getUserById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  getOperators: async () => {
    const { data } = await api.get("/users/operators");
    return data;
  },
  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.post(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  deleteAvatar: async (id) => {
    const { data } = await api.delete(`/users/${id}/avatar`);
    return data;
  },
};

export default userService;
