import api from "./api";

const roleService = {
  getRoles: async () => {
    const { data } = await api.get("/roles");
    return data;
  },
  getRole: async (id) => {
    const { data } = await api.get(`/roles/${id}`);
    return data;
  },
  getPermissions: async () => {
    const { data } = await api.get("/roles/permissions");
    return data;
  },
  createRole: async (payload) => {
    const { data } = await api.post("/roles", payload);
    return data;
  },
  updateRole: async (id, payload) => {
    const { data } = await api.put(`/roles/${id}`, payload);
    return data;
  },
  deleteRole: async (id) => {
    const { data } = await api.delete(`/roles/${id}`);
    return data;
  },
  updateRolePermissions: async (id, permissionIds) => {
    const { data } = await api.put(`/roles/${id}/permissions`, { permissionIds });
    return data;
  },
};

export default roleService;
