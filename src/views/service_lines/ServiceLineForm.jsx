import { useEffect, useState } from "react";
import { toast } from "sonner";
import serviceLinesService from "@/services/service_lines.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";

export default function ServiceLineForm({
  isOpen,
  onClose,
  onSuccess,
  serviceLineId,
}) {
  const isEditing = !!serviceLineId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: "", description: "", is_active: true });
      setErrors({});
      return;
    }
    if (serviceLineId) fetchServiceLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, serviceLineId]);

  const fetchServiceLine = async () => {
    try {
      setFetching(true);
      const res = await serviceLinesService.getById(serviceLineId);
      const line = res?.data || res;
      setForm({
        name: line.name || "",
        description: line.description || "",
        is_active: line.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar la línea de servicio");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "El nombre es requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    try {
      setLoading(true);
      let result;
      if (isEditing) {
        result = await serviceLinesService.update(serviceLineId, payload);
        toast.success(result?.message || "Línea de servicio actualizada");
      } else {
        result = await serviceLinesService.create(payload);
        toast.success(result?.message || "Línea de servicio creada");
      }
      onSuccess(result?.data || payload);
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "No se pudo guardar la línea de servicio",
      );
    } finally {
      setLoading(false);
    }
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

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Línea de Servicio" : "Nueva Línea de Servicio"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Actualiza los datos de la línea"
                : "Completa los datos para registrar la línea"}
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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <div className="flex h-9 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
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
                    {form.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  name="name"
                  placeholder="Ej: Offset"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                  }}
                  className="h-9 text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descripción (opcional)</Label>
                <textarea
                  rows={3}
                  placeholder="Breve descripción de la línea de servicio"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#13529a] focus:ring-2 focus:ring-[#13529a]/20"
                />
              </div>

              <div className="flex gap-3 border-t pt-4">
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
