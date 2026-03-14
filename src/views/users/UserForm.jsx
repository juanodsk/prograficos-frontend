// src/components/common/UserFormModal.jsx
import { useState, useEffect } from "react";
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
import { X, Loader2, Save, User } from "lucide-react";

const roles = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "EMPLOYEE", label: "Empleado" },
  { value: "USER", label: "Usuario" },
];

/**
 * UserFormModal
 *
 * Props:
 *  - isOpen     {boolean}        Controla visibilidad
 *  - onClose    {function}       Cierra el modal
 *  - onSuccess  {function(user)} Se llama tras crear/editar exitosamente
 *  - userId     {number|null}    Si tiene valor → modo edición
 */
export default function UserForm({ isOpen, onClose, onSuccess, userId }) {
  const { user: currentUser } = useAuthStore();
  const isEditing = !!userId;

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

  // Cargar datos cuando es edición
  useEffect(() => {
    if (isOpen && isEditing) {
      fetchUser();
    }
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, userId]);

  const resetForm = () => {
    setForm({
      name: "",
      surename: "",
      email: "",
      password: "",
      role: "USER",
      avatar: "",
    });
    setErrors({});
  };

  const fetchUser = async () => {
    try {
      setFetching(true);
      const data = await userService.getUserById(userId);
      const u = data.data.user;
      setForm({
        name: u.name || "",
        surename: u.surename || "",
        email: u.email || "",
        password: "",
        role: u.role || "USER",
        avatar: u.avatar || "",
      });
    } catch {
      toast.error("Error al cargar el usuario");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
    if (!form.surename.trim()) newErrors.surename = "El apellido es requerido";
    if (!form.email.trim()) newErrors.email = "El email es requerido";
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

      // Si no es ADMIN ni SUPERVISOR, no enviar role
      // Si es edición y no tiene permisos para cambiar rol, no enviarlo
      if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPERVISOR") {
        delete payload.role;
      }

      let result;
      if (isEditing) {
        result = await userService.updateUser(userId, payload);
        toast.success("Usuario actualizado exitosamente");
      } else {
        result = await userService.createUser(payload);
        toast.success("Usuario creado exitosamente");
      }
      onSuccess(result?.data?.user || payload);
      onClose();
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

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in">
        {/* Franja top */}
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            {/* Avatar preview */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#13529a]/10 flex items-center justify-center text-base font-bold text-[#13529a] shrink-0">
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
                <User size={18} />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#13529a]">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing
                  ? "Modifica los datos del usuario"
                  : "Completa los datos para crear un usuario"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} className="cursor-pointer" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
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
                    disabled={
                      currentUser?.role !== "ADMIN" &&
                      currentUser?.role !== "SUPERVISOR"
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.value !== "ADMIN")
                        .map((r) => (
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
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-8 text-sm cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-8 text-sm bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
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
          )}
        </div>
      </div>

      <style>{`
        @keyframes animateIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: animateIn 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}
