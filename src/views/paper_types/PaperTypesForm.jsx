import { useState, useEffect } from "react";
import { toast } from "sonner";
import paperTypesService from "../../services/paper_types.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Save } from "lucide-react";

export default function PaperTypesForm({
  isOpen,
  onClose,
  onSuccess,
  paperTypeId,
}) {
  const isEditing = !!paperTypeId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    grammage: "",
    is_active: true,
  });

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (paperTypeId) {
      fetchPaperType();
    }
  }, [isOpen, paperTypeId]);

  const resetForm = () => {
    setForm({ name: "", description: "", grammage: "", is_active: true });
    setErrors({});
  };

  const fetchPaperType = async () => {
    try {
      setFetching(true);
      const res = await paperTypesService.getById(paperTypeId);
      const p = res.data;
      setForm({
        name: p.name || "",
        description: p.description || "",
        grammage: p.grammage || "",
        is_active: p.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el tipo de papel");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
    if (!form.description.trim())
      newErrors.description = "La descripción es requerida";
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
        description: form.description,
        grammage: form.grammage ? parseFloat(form.grammage) : undefined,
        is_active: form.is_active,
      };
      let result;
      if (isEditing) {
        result = await paperTypesService.update(paperTypeId, payload);
        toast.success(result?.data?.message || "Tipo de papel actualizado");
      } else {
        result = await paperTypesService.create(payload);
        toast.success(result?.data?.message || "Tipo de papel creado");
      }
      onSuccess(result?.data?.paper_type || result?.data || payload);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error al guardar");
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Tipo de Papel" : "Nuevo Tipo de Papel"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos del tipo de papel"
                : "Completa los datos para crear un tipo de papel"}
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
        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Descripción */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    name="name"
                    placeholder="Ej: Cartulina"
                    value={form.name}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Input
                    name="description"
                    placeholder="Ej: Papel satinado brillante"
                    value={form.description}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Gramaje y Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Gramaje (opcional)</Label>
                  <Input
                    name="grammage"
                    placeholder="Ej: 300g/m²"
                    value={form.grammage}
                    onChange={handleChange}
                    className="h-8 text-sm"
                    type="number"
                  />
                  {errors.grammage && (
                    <p className="text-xs text-red-500">{errors.grammage}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <div className="flex items-center gap-2 h-8">
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
                      {isEditing ? "Actualizar" : "Crear Tipo de Papel"}
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
