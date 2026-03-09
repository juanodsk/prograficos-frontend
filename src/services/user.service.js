import api from "./api";

const userService = {
  getUsers: async () => {
    const { data } = await api.get("/users");
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
};

export default userService;
