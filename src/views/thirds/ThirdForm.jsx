import { useState, useEffect } from "react";
import { toast } from "sonner";
import thirdsService from "../../services/thirds.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DOCUMENT_TYPE_OPTIONS,
  PERSON_TYPE_OPTIONS,
  THIRD_TYPE_OPTIONS,
} from "@/constants/thirds";

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
    person_type: "",
    document_type: "",
    document_number: "",
    company_name: "",
    is_active: true,
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
      person_type: "",
      document_type: "",
      document_number: "",
      company_name: "",
      is_active: true,
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
        person_type: t?.person_type || "",
        document_type: t?.document_type || "",
        document_number: t?.document_number || "",
        company_name: t?.company_name || "",
        is_active: t?.is_active ?? true,
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

    if (!form.type_person)
      newErrors.type_person = "Selecciona el tipo de tercero";
    if (!form.person_type)
      newErrors.person_type = "Selecciona el tipo de persona";
    if (!form.document_type)
      newErrors.document_type = "Selecciona el tipo de documento";
    if (!form.document_number.trim())
      newErrors.document_number = "El número de documento es requerido";

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
        person_type: form.person_type,
        document_type: form.document_type,
        document_number: form.document_number,
        company_name: form.company_name || null,
        is_active: form.is_active,
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
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
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
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {fetching ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Resumen del tercero
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tipo de tercero
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {THIRD_TYPE_OPTIONS.find(
                          (option) => option.value === form.type_person,
                        )?.label || "Sin definir"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tipo de persona
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {PERSON_TYPE_OPTIONS.find(
                          (option) => option.value === form.person_type,
                        )?.label || "Sin definir"}
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

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Empresa ABC"
                        className="h-9 text-sm"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="correo@empresa.com"
                        className="h-9 text-sm"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Dirección</Label>
                      <Input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Calle 10 #20-30"
                        className="h-9 text-sm"
                      />
                      {errors.address && (
                        <p className="text-xs text-red-500">{errors.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de tercero</Label>
                      <Select
                        value={form.type_person}
                        onValueChange={(value) => {
                          setForm((prev) => ({ ...prev, type_person: value }));
                          if (errors.type_person) {
                            setErrors((prev) => ({ ...prev, type_person: "" }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {THIRD_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type_person && (
                        <p className="text-xs text-red-500">
                          {errors.type_person}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de persona</Label>
                      <Select
                        value={form.person_type}
                        onValueChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            person_type: value,
                            company_name:
                              value === "JURIDICA" ? prev.company_name : "",
                          }));
                          if (errors.person_type) {
                            setErrors((prev) => ({
                              ...prev,
                              person_type: "",
                            }));
                          }
                          if (value !== "JURIDICA" && errors.company_name) {
                            setErrors((prev) => ({
                              ...prev,
                              company_name: "",
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {PERSON_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.person_type && (
                        <p className="text-xs text-red-500">
                          {errors.person_type}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de documento</Label>
                      <Select
                        value={form.document_type}
                        onValueChange={(value) => {
                          setForm((prev) => ({ ...prev, document_type: value }));
                          if (errors.document_type) {
                            setErrors((prev) => ({
                              ...prev,
                              document_type: "",
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecciona un documento" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.document_type && (
                        <p className="text-xs text-red-500">
                          {errors.document_type}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Número de documento</Label>
                      <Input
                        name="document_number"
                        value={form.document_number}
                        onChange={handleChange}
                        placeholder="Ej: 900123456"
                        className="h-9 text-sm"
                      />
                      {errors.document_number && (
                        <p className="text-xs text-red-500">
                          {errors.document_number}
                        </p>
                      )}
                    </div>
                  </div>

                  {form.person_type === "JURIDICA" && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Razón social / Empresa (opcional)
                      </Label>
                      <Input
                        name="company_name"
                        value={form.company_name}
                        onChange={handleChange}
                        placeholder="Nombre empresa"
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
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
                      {isEditing ? "Actualizar" : "Crear"}
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
