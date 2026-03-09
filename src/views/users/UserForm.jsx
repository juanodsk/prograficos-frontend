import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import userService from "../../services/user.service";
import { useAuthStore } from "../../store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, User } from "lucide-react";

const roles = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "EMPLOYEE", label: "Empleado" },
  { value: "USER", label: "Usuario" },
];

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    surename: "",
    email: "",
    password: "",
    role: "USER",
    avatar: "",
  });

  useEffect(() => {
    if (isEditing) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setFetching(true);
      const data = await userService.getUserById(id);
      const u = data.data.user;
      setForm({
        name: u.name || "",
        surename: u.surename || "",
        email: u.email || "",
        password: "",
        role: u.role || "USER",
        avatar: u.avatar || "",
      });
    } catch (error) {
      toast.error("Error al cargar el usuario");
      navigate("/admin/usuarios");
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "El nombre es requerido";
    if (!form.surename) newErrors.surename = "El apellido es requerido";
    if (!form.email) newErrors.email = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Email inválido";
    if (!isEditing && !form.password)
      newErrors.password = "La contraseña es requerida";
    if (!isEditing && form.password?.length < 6)
      newErrors.password = "Mínimo 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = { ...form };
      if (isEditing && !payload.password) delete payload.password;

      if (isEditing) {
        await userService.updateUser(id, payload);
        toast.success("Usuario actualizado exitosamente");
      } else {
        await userService.createUser(payload);
        toast.success("Usuario creado exitosamente");
      }
      navigate("/admin/usuarios");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[#13529a]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/usuarios")}
          className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#13529a]">
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </h1>
          <p className="text-xs text-gray-500">
            {isEditing
              ? "Modifica los datos del usuario"
              : "Completa los datos para crear un usuario"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border shadow-sm p-5 w-full">
        {/* Avatar preview */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#13529a]/10 flex items-center justify-center text-lg font-bold text-[#13529a] shrink-0">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              form.name?.charAt(0).toUpperCase() || <User size={20} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">
              {form.name || "Nombre"} {form.surename || "Apellido"}
            </p>
            <p className="text-xs text-gray-500">
              {form.email || "correo@ejemplo.com"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Juan"
                value={form.name}
                onChange={handleChange}
                className="h-8 text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Apellido</Label>
              <Input
                id="surename"
                name="surename"
                placeholder="Pérez"
                value={form.surename}
                onChange={handleChange}
                className="h-8 text-sm"
              />
              {errors.surename && (
                <p className="text-xs text-red-500">{errors.surename}</p>
              )}
            </div>
          </div>

          {/* Email y Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                className="h-8 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {isEditing
                  ? "Nueva Contraseña (vacío = no cambiar)"
                  : "Contraseña"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="h-8 text-sm"
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Rol y Avatar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value }))
                }
                disabled={currentUser?.role !== "ADMIN"}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL Avatar (opcional)</Label>
              <Input
                id="avatar"
                name="avatar"
                placeholder="https://..."
                value={form.avatar}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/usuarios")}
              className="flex-1 h-8 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-8 text-sm bg-[#13529a] hover:bg-[#0f3f7a] text-white"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={14} className="mr-2" />
                  {isEditing ? "Actualizar" : "Crear Usuario"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
