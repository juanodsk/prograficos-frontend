import { useState, useEffect } from "react";
import { toast } from "sonner";
import measuresService from "../../services/measures.service";
import formatsService from "@/services/formats.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, Save } from "lucide-react";

export default function MeasuresForm({
  isOpen,
  onClose,
  onSuccess,
  measureId,
}) {
  const isEditing = !!measureId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formats, setFormats] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    width: "",
    height: "",
    format_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) loadData();
    if (!isOpen) resetForm();
  }, [isOpen, measureId]);

  const resetForm = () => {
    setForm({ width: "", height: "", format_id: "", is_active: true });
    setErrors({});
  };

  const loadData = async () => {
    try {
      setFetching(true);
      const [formatsRes, measureRes] = await Promise.all([
        formatsService.getAll({ onlyActive: true }),
        isEditing ? measuresService.getById(measureId) : Promise.resolve(null),
      ]);

      setFormats(formatsRes?.data || formatsRes || []);

      if (measureRes) {
        const m = measureRes?.data || measureRes;
        setForm({
          width: m.width || "",
          height: m.height || "",
          format_id: m.format_id ? String(m.format_id) : "",
          is_active: m.is_active ?? true,
        });
      }
    } catch {
      toast.error("Error al cargar los datos");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.width) newErrors.width = "El ancho es requerido";
    else if (isNaN(form.width)) newErrors.width = "Debe ser un número";
    if (!form.height) newErrors.height = "El alto es requerido";
    else if (isNaN(form.height)) newErrors.height = "Debe ser un número";
    if (!form.format_id) newErrors.format_id = "Selecciona un formato";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = {
        width: parseFloat(form.width),
        height: parseFloat(form.height),
        format_id: parseInt(form.format_id),
        is_active: form.is_active,
      };
      let result;
      if (isEditing) {
        result = await measuresService.update(measureId, payload);
        toast.success("Medida actualizada");
      } else {
        result = await measuresService.create(payload);
        toast.success("Medida creada");
      }
      onSuccess(result?.data?.measure || result?.data || payload);
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Medida" : "Nueva Medida"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos de la medida"
                : "Completa los datos para crear una medida"}
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
              {/* Ancho y Alto */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Ancho</Label>
                  <Input
                    name="width"
                    placeholder="Ej: 21"
                    value={form.width}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, width: e.target.value }));
                      if (errors.width)
                        setErrors((prev) => ({ ...prev, width: "" }));
                    }}
                    className="h-8 text-sm"
                  />
                  {errors.width && (
                    <p className="text-xs text-red-500">{errors.width}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alto</Label>
                  <Input
                    name="height"
                    placeholder="Ej: 29.7"
                    value={form.height}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, height: e.target.value }));
                      if (errors.height)
                        setErrors((prev) => ({ ...prev, height: "" }));
                    }}
                    className="h-8 text-sm"
                  />
                  {errors.height && (
                    <p className="text-xs text-red-500">{errors.height}</p>
                  )}
                </div>
              </div>

              {/* Formato */}
              <div className="space-y-1">
                <Label className="text-xs">Formato</Label>
                <Select
                  value={form.format_id}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, format_id: value }));
                    if (errors.format_id)
                      setErrors((prev) => ({ ...prev, format_id: "" }));
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona un formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Formatos disponibles</SelectLabel>
                      {formats.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.format_id && (
                  <p className="text-xs text-red-500">{errors.format_id}</p>
                )}
              </div>

              {/* Estado */}
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
                      {isEditing ? "Actualizar" : "Crear Medida"}
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
