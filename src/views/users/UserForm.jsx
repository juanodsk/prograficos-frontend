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

export default function UserForm({ isOpen, onClose, onSuccess, userId }) {
  const { user: currentUser, updateUser: updateAuthUser } = useAuthStore();
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
    is_active: true,
  });

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
      is_active: true,
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
        is_active: u.is_active ?? true,
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
      const savedUser = result?.data?.user || payload;

      if (isEditing && currentUser?.id === userId) {
        updateAuthUser(savedUser);
      }

      onSuccess(savedUser);
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
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#13529a]/10 text-[#13529a]">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
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
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} className="cursor-pointer" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#13529a]/10 text-[#13529a]">
                      {form.avatar ? (
                        <img
                          src={form.avatar}
                          alt="avatar"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <User size={28} />
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">
                      {form.name || "Nuevo"} {form.surename || "usuario"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {form.email || "Sin correo"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4 border-t border-slate-200 pt-4">
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
                        <SelectTrigger className="h-9 text-sm">
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
                      <Label className="text-xs">Estado</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              is_active: !prev.is_active,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                            form.is_active ? "bg-[#13529a]" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              form.is_active ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-700">
                          {form.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        name="name"
                        placeholder="Juan"
                        value={form.name}
                        onChange={handleChange}
                        className="h-9 text-sm"
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
                        className="h-9 text-sm"
                      />
                      {errors.surename && (
                        <p className="text-xs text-red-500">{errors.surename}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={form.email}
                        onChange={handleChange}
                        className="h-9 text-sm"
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
                        className="h-9 text-sm"
                      />
                      {errors.password && (
                        <p className="text-xs text-red-500">
                          {errors.password}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">URL Avatar (opcional)</Label>
                      <Input
                        name="avatar"
                        placeholder="https://..."
                        value={form.avatar}
                        onChange={handleChange}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-9 flex-1 cursor-pointer text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-9 flex-1 cursor-pointer bg-[#13529a] text-sm text-white hover:bg-[#0f3f7a]"
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
