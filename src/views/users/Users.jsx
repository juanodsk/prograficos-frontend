// src/views/users/Users.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import userService from "../../services/user.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import UserForm from "../users/UserForm";
import { useAuthStore } from "../../store/authStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  UserCog,
  User,
  HardHat,
} from "lucide-react";

const roleConfig = {
  ADMIN: {
    label: "ADMINISTRADOR",
    icon: ShieldCheck,
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  SUPERVISOR: {
    label: "SUPERVISOR",
    icon: UserCog,
    className: "bg-blue-100 text-[#13529a] border-blue-200",
  },
  EMPLOYEE: {
    label: "EMPLEADO",
    icon: HardHat,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  USER: {
    label: "USUARIO",
    icon: User,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const RoleBadge = ({ role }) => {
  const config = roleConfig[role] || roleConfig.USER;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal de formulario
  const [formModal, setFormModal] = useState({
    isOpen: false,
    userId: null, // null = crear, number = editar
  });

  // Modal de confirmación de eliminación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    loading: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch {
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  // ── Form modal ──────────────────────────────────────────
  const handleOpenCreate = () => setFormModal({ isOpen: true, userId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, userId: id });
  const handleCloseForm = () => setFormModal({ isOpen: false, userId: null });

  const handleFormSuccess = (savedUser) => {
    if (formModal.userId) {
      // Edición: actualiza en la lista local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === formModal.userId ? { ...u, ...savedUser } : u,
        ),
      );
    } else {
      // Creación: recarga la lista completa para tener el id real
      fetchUsers();
    }
  };

  // ── Confirm dialog ──────────────────────────────────────
  const handleDeleteClick = (user) => {
    setConfirmDialog({
      isOpen: true,
      userId: user.id,
      userName: `${user.name} ${user.surename}`,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, userId: null }));
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      await userService.deleteUser(confirmDialog.userId);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDialog.userId));
      toast.success("Usuario eliminado correctamente");
      setConfirmDialog({
        isOpen: false,
        userId: null,
        userName: "",
        loading: false,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo eliminar el usuario",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const filtered = users.filter((u) =>
    `${u.name} ${u.surename} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Usuarios</h1>
          <p className="text-sm text-gray-500">
            {users.length} usuarios registrados
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Buscar por nombre o email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No se encontraron usuarios
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#13529a]/5">
                <TableHead className="text-[#13529a] font-semibold">
                  Avatar
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Nombre
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Email
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Rol
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className="hover:bg-[#13529a]/5 transition-colors"
                >
                  <TableCell>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#13529a]/10 flex items-center justify-center text-sm font-medium text-[#13529a]">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">
                      {u.name} {u.surename}
                    </p>
                    <p className="text-xs text-gray-400">ID: {u.id}</p>
                  </TableCell>
                  <TableCell className="text-gray-600">{u.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(u.id)}
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </Button>
                      {currentUser?.id !== u.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(u)}
                          className="hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal formulario crear/editar */}
      <UserForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        userId={formModal.userId}
      />

      {/* Modal confirmación eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar usuario?"
        description={`Estás a punto de eliminar a "${confirmDialog.userName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Users;
