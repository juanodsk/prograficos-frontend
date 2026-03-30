import { useEffect, useState } from "react";
import { toast } from "sonner";
import machineryService from "@/services/machinery.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";

export default function MachineryForm({
  isOpen,
  onClose,
  onSuccess,
  machineryId,
}) {
  const isEditing = !!machineryId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    reference: "",
    type: "",
    is_active: true,
  });

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (machineryId) {
      fetchMachinery();
    }
  }, [isOpen, machineryId]);

  const resetForm = () => {
    setForm({
      name: "",
      reference: "",
      type: "",
      is_active: true,
    });
    setErrors({});
  };

  const fetchMachinery = async () => {
    try {
      setFetching(true);
      const response = await machineryService.getById(machineryId);
      const machinery = response?.data || response;

      setForm({
        name: machinery.name || "",
        reference: machinery.reference || "",
        type: machinery.type || "",
        is_active: machinery.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar la maquinaria");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
    if (!form.reference.trim()) newErrors.reference = "El código es requerido";
    if (!form.type.trim()) newErrors.type = "El tipo es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        reference: form.reference.trim(),
        type: form.type.trim(),
        is_active: form.is_active,
      };

      let result;
      if (isEditing) {
        result = await machineryService.update(machineryId, payload);
        toast.success(result?.message || "Maquinaria actualizada");
      } else {
        result = await machineryService.create(payload);
        toast.success(result?.message || "Maquinaria creada");
      }

      onSuccess(result?.data || payload);
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo guardar la maquinaria",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Maquinaria" : "Nueva Maquinaria"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Actualiza los datos de la máquina"
                : "Completa los datos para registrar una máquina"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    name="name"
                    placeholder="Ej: Heidelberg CD 74"
                    value={form.name}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Código / Referencia</Label>
                  <Input
                    name="reference"
                    placeholder="Ej: HCD-74"
                    value={form.reference}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.reference && (
                    <p className="text-xs text-red-500">
                      {errors.reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Input
                    name="type"
                    placeholder="Ej: Impresión"
                    value={form.type}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.type && (
                    <p className="text-xs text-red-500">{errors.type}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <div className="flex h-8 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: !prev.is_active,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
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
                      {form.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-8 flex-1 cursor-pointer text-sm"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-8 flex-1 cursor-pointer bg-[#13529a] text-sm text-white hover:bg-[#0f3f7a]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} className="mr-2" />
                      {isEditing ? "Actualizar" : "Crear Maquinaria"}
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
