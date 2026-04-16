import { useState, useEffect } from "react";
import { toast } from "sonner";
import formatsService from "../../services/formats.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Save } from "lucide-react";

export default function FormatoFormModal({
  isOpen,
  onClose,
  onSuccess,
  formatId,
}) {
  const isEditing = !!formatId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    sheet_divisions: "1",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen && isEditing) fetchFormato();
    if (!isOpen) resetForm();
  }, [isOpen, formatId]);

  const resetForm = () => {
    setForm({ name: "", sheet_divisions: "1", is_active: true });
    setErrors({});
  };

  const fetchFormato = async () => {
    try {
      setFetching(true);
      const res = await formatsService.getById(formatId);
      const f = res?.data?.format || res?.data || res;
      setForm({
        name: f.name || "",
        sheet_divisions: f.sheet_divisions ? String(f.sheet_divisions) : "1",
        is_active: f.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el formato");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
    if (!form.sheet_divisions || Number(form.sheet_divisions) <= 0) {
      newErrors.sheet_divisions = "Las divisiones del pliego deben ser mayores a 0";
    }
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
        sheet_divisions: Number(form.sheet_divisions),
        is_active: form.is_active,
      };
      let result;
      if (isEditing) {
        result = await formatsService.update(formatId, payload);
        toast.success("Formato actualizado");
      } else {
        result = await formatsService.create(payload);
        toast.success("Formato creado");
      }
      onSuccess(result?.data?.format || result?.data || payload);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Cerrar con Escape
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Formato" : "Nuevo Formato"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos del formato"
                : "Completa los datos para crear un formato"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    name="name"
                    placeholder="Ej: 1 Pliego"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className="h-9 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Divisiones del pliego</Label>
                  <Input
                    name="sheet_divisions"
                    type="number"
                    min="1"
                    placeholder="Ej: 4"
                    value={form.sheet_divisions}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        sheet_divisions: e.target.value,
                      }));
                      if (errors.sheet_divisions)
                        setErrors((prev) => ({
                          ...prev,
                          sheet_divisions: "",
                        }));
                    }}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-gray-400">
                    Ejemplo: para formato 1/4, registra 4; para 1/8, registra 8.
                  </p>
                  {errors.sheet_divisions && (
                    <p className="text-xs text-red-500">
                      {errors.sheet_divisions}
                    </p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
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

              {/* Botones */}
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-9 text-sm cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 text-sm bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} className="mr-2" />
                      {isEditing ? "Actualizar" : "Crear Formato"}
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
