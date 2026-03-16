import { useState, useEffect } from "react";
import { toast } from "sonner";
import userService from "../../services/user.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import UserForm from "../users/UserForm";
import UserView from "./UserView";
import DataTable from "../../components/data-table/DataTable";
import { useAuthStore } from "../../store/authStore";

import { Button } from "@/components/ui/button";

import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  UserCog,
  User,
  HardHat,
  ScanEye,
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

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    userId: null,
  });

  const [formModal, setFormModal] = useState({
    isOpen: false,
    userId: null,
  });

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

  // ───────────── MODALES ─────────────

  const handleOpenCreate = () => setFormModal({ isOpen: true, userId: null });

  const handleOpenEdit = (id) => setFormModal({ isOpen: true, userId: id });

  const handleCloseForm = () => setFormModal({ isOpen: false, userId: null });

  const handleView = (id) => setViewModal({ isOpen: true, userId: id });

  const handleCloseView = () => setViewModal({ isOpen: false, userId: null });

  const handleFormSuccess = (savedUser) => {
    if (formModal.userId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === formModal.userId ? { ...u, ...savedUser } : u,
        ),
      );
    } else {
      fetchUsers();
    }
  };

  // ───────────── ELIMINAR ─────────────

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

    setConfirmDialog({
      isOpen: false,
      userId: null,
      userName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));

    try {
      await userService.deleteUser(confirmDialog.userId);

      setUsers((prev) => prev.filter((u) => u.id !== confirmDialog.userId));

      toast.success("Usuario eliminado correctamente");

      handleCloseDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo eliminar el usuario",
      );

      setConfirmDialog((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  // ───────────── COLUMNAS ─────────────

  const columns = [
    {
      key: "avatar",
      label: "Avatar",
      render: (row) => (
        <div className="w-8 h-8 rounded-full overflow-hidden">
          {row?.avatar && (
            <img
              src={row.avatar}
              alt={row.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.name} {row.surename}
          </p>
          <p className="text-xs text-gray-400">ID: {row.id}</p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Rol",
      render: (row) => <RoleBadge role={row.role} />,
    },
  ];

  // ───────────── ACCIONES ─────────────

  const actions = (row) => {
    const canEdit = row.role !== "ADMIN" || currentUser?.role === "ADMIN";

    const canDelete = row.role !== "ADMIN" || currentUser?.role === "ADMIN";

    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleView(row.id)}
          className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
        >
          <ScanEye size={16} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          disabled={!canEdit}
          onClick={() => canEdit && handleOpenEdit(row.id)}
          className={
            canEdit
              ? "hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-50"
          }
        >
          <Pencil size={16} />
        </Button>

        {currentUser?.id !== row.id && (
          <Button
            size="icon"
            variant="ghost"
            disabled={!canDelete}
            onClick={() => canDelete && handleDeleteClick(row)}
            className={
              canDelete
                ? "hover:text-red-600 hover:bg-red-50 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-50"
            }
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    );
  };

  // ───────────── UI ─────────────

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
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla */}

      <div className="bg-white rounded-xl border shadow-sm p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable data={users} columns={columns} actions={actions} />
        )}
      </div>

      {/* Modal formulario */}

      <UserForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        userId={formModal.userId}
      />

      {/* Modal ver */}

      <UserView
        isOpen={viewModal.isOpen}
        onClose={handleCloseView}
        userId={viewModal.userId}
      />

      {/* Confirm dialog */}

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
