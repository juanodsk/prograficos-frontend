import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import userService from "../../services/user.service";
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
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch (error) {
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await userService.deleteUser(id);
      toast.success("Usuario eliminado exitosamente");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar");
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
          onClick={() => navigate("/admin/users/create")}
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
                  {/* Avatar */}
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

                  {/* Nombre */}
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {u.name} {u.surename}
                      </p>
                      <p className="text-xs text-gray-400">ID: {u.id}</p>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-gray-600">{u.email}</TableCell>

                  {/* Rol */}
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/admin/usuario/${u.id}/edit`)}
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </Button>
                      {currentUser?.id !== u.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(u.id)}
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
    </div>
  );
};

export default Users;
