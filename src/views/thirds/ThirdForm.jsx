// src/components/common/ThirdForm.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import thirdsService from "../../services/thirds.service";

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

import { X, Loader2, Save } from "lucide-react";

export default function ThirdForm({ isOpen, onClose, onSuccess, thirdId }) {
  const isEditing = !!thirdId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    type_person: "",
    company_name: "",
  });

  useEffect(() => {
    if (isOpen && isEditing) fetchThird();
    if (!isOpen) resetForm();
  }, [isOpen, thirdId]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      address: "",
      type_person: "",
      company_name: "",
    });
    setErrors({});
  };

  const fetchThird = async () => {
    try {
      setFetching(true);

      const res = await thirdsService.getById(thirdId);
      const t = res?.data?.third;

      setForm({
        name: t?.name || "",
        email: t?.email || "",
        address: t?.address || "",
        type_person: t?.type_person || "",
        company_name: t?.company_name || "",
      });
    } catch {
      toast.error("Error al cargar el tercero");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "El nombre es requerido";

    if (!form.email.trim()) newErrors.email = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Email inválido";

    if (!form.address.trim()) newErrors.address = "La dirección es requerida";

    if (!form.type_person) newErrors.type_person = "Selecciona un tipo";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        email: form.email,
        address: form.address,
        type_person: form.type_person,
        company_name: form.company_name || null,
        is_active: true,
      };

      let result;

      if (isEditing) {
        result = await thirdsService.update(thirdId, payload);
        toast.success("Tercero actualizado");
      } else {
        result = await thirdsService.create(payload);
        toast.success("Tercero creado");
      }

      onSuccess(result?.data?.third || payload);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Tercero" : "Nuevo Tercero"}
            </h2>

            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos del tercero"
                : "Completa los datos para crear un tercero"}
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Empresa ABC"
                  className="h-8 text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@empresa.com"
                  className="h-8 text-sm"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <Label className="text-xs">Dirección</Label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Calle 10 #20-30"
                  className="h-8 text-sm"
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo de tercero</Label>

                <Select
                  value={form.type_person}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type_person: value }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa */}
              <div className="space-y-1">
                <Label className="text-xs">Empresa (opcional)</Label>
                <Input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Nombre empresa"
                  className="h-8 text-sm"
                />
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
                      {isEditing ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
