import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service";
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
import { X, Loader2, Save, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { es } from "date-fns/locale";

export default function TroquelFormModal({
  isOpen,
  onClose,
  onSuccess,
  troquelId,
}) {
  const isEditing = !!troquelId;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    elaboration_date: new Date(),
    size: "SMALL",
    file_name: "",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen && isEditing) fetchTroquel();
    if (!isOpen) resetForm();
  }, [isOpen, troquelId]);

  const resetForm = () => {
    setForm({
      elaboration_date: new Date(),
      size: "SMALL",
      file_name: "",
      is_active: true,
    });
    setErrors({});
    setCalendarOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // troquelesService.getById ya retorna `data` (el body del response)
  // por lo que data.data.data es incorrecto

  const fetchTroquel = async () => {
    try {
      setFetching(true);
      const res = await troquelesService.getById(troquelId);
      const t = res.data; // ← un solo .data, no .data.data

      setForm({
        elaboration_date: new Date(t.elaboration_date),
        size: t.size || "SMALL",
        file_name: t.file_name || "",
        is_active: t.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el troquel");
      onClose();
    } finally {
      setFetching(false);
    }
  };
  const validate = () => {
    const newErrors = {};
    if (!form.elaboration_date)
      newErrors.elaboration_date = "La fecha es requerida";
    if (!form.size) newErrors.size = "Selecciona un tamaño";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, file_name: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("elaboration_date", form.elaboration_date.toISOString());
      formData.append("size", form.size);
      formData.append("is_active", form.is_active);
      if (fileInputRef.current?.files?.[0]) {
        formData.append("file", fileInputRef.current.files[0]);
      }

      let result;
      if (isEditing) {
        result = await troquelesService.update(troquelId, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Troquel actualizado");
      } else {
        result = await troquelesService.create(formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Troquel creado");
      }

      onSuccess(result.data);
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
              {isEditing ? "Editar Troquel" : "Nuevo Troquel"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos del troquel"
                : "Completa los datos para crear un troquel"}
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
              {/* Fecha */}
              <div className="space-y-1">
                <Label className="text-xs">Fecha de Elaboración</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger>
                    <div
                      className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setCalendarOpen((prev) => !prev)}
                    >
                      <span>
                        {form.elaboration_date
                          ? format(form.elaboration_date, "PPP", { locale: es })
                          : "Selecciona fecha"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.elaboration_date}
                      onSelect={(date) => {
                        setForm((prev) => ({
                          ...prev,
                          elaboration_date: date,
                        }));
                        setCalendarOpen(false);
                      }}
                      defaultMonth={form.elaboration_date}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                {errors.elaboration_date && (
                  <p className="text-xs text-red-500">
                    {errors.elaboration_date}
                  </p>
                )}
              </div>

              {/* Tamaño */}
              <div className="space-y-1">
                <Label className="text-xs">Tamaño</Label>
                <Select
                  value={form.size}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, size: value }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LARGE">Large</SelectItem>
                  </SelectContent>
                </Select>
                {errors.size && (
                  <p className="text-xs text-red-500">{errors.size}</p>
                )}
              </div>

              {/* Archivo */}
              <div className="space-y-1">
                <Label className="text-xs">Archivo de Troquel</Label>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="h-8 text-sm"
                />
                {form.file_name && (
                  <p className="text-xs text-gray-500 mt-1">{form.file_name}</p>
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
                      {isEditing ? "Actualizar" : "Crear Troquel"}
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
