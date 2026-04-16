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

const sizeLabels = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
};

const sizeBadgeClass = {
  SMALL: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-red-100 text-red-800",
  LARGE: "bg-green-100 text-green-800",
};

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

  const fetchTroquel = async () => {
    try {
      setFetching(true);
      const res = await troquelesService.getById(troquelId);
      const t = res.data;

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
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
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
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Resumen del troquel
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tamaño
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          sizeBadgeClass[form.size] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sizeLabels[form.size] || form.size}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Fecha
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {form.elaboration_date
                          ? format(form.elaboration_date, "PPP", { locale: es })
                          : "Sin fecha"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Estado
                      </p>
                      <div className="mt-2 flex items-center gap-2">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Elaboración</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger>
                        <div
                          className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setCalendarOpen((prev) => !prev)}
                        >
                          <span>
                            {form.elaboration_date
                              ? format(form.elaboration_date, "PPP", {
                                  locale: es,
                                })
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

                  <div className="space-y-1">
                    <Label className="text-xs">Tamaño</Label>
                    <Select
                      value={form.size}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger className="h-9 text-sm w-full">
                        <SelectValue placeholder="Selecciona tamaño">
                          {sizeLabels[form.size] || form.size}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMALL">Pequeño</SelectItem>
                        <SelectItem value="MEDIUM">Mediano</SelectItem>
                        <SelectItem value="LARGE">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.size && (
                      <p className="text-xs text-red-500">{errors.size}</p>
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Archivo de Troquel</Label>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="h-9 text-sm"
                    />
                    {form.file_name && (
                      <p className="mt-1 break-all text-xs text-gray-500">
                        {form.file_name}
                      </p>
                    )}
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
