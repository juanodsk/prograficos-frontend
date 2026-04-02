import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import paperTypesService from "../../services/paper_types.service";
import thirdsService from "../../services/thirds.service";
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
import { X, Loader2, Save, Plus, Trash2 } from "lucide-react";

const buildInitialForm = () => ({
  name: "",
  description: "",
  grammage: "",
  is_active: true,
  supplier_id: "",
  supplier_price: "",
  suppliers: [],
});

const formatProviderLabel = (provider) =>
  provider?.company_name || provider?.name || "Proveedor sin nombre";

const formatCurrency = (value) => {
  const amount = Number(value);

  if (Number.isNaN(amount)) return "$0";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PaperTypesForm({
  isOpen,
  onClose,
  onSuccess,
  paperTypeId,
}) {
  const isEditing = !!paperTypeId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [providers, setProviders] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(buildInitialForm());

  const availableProviders = useMemo(
    () =>
      providers.filter(
        (provider) =>
          !form.suppliers.some((supplier) => supplier.third_id === provider.id),
      ),
    [providers, form.suppliers],
  );

  const selectedProvider = useMemo(
    () =>
      providers.find(
        (provider) => String(provider.id) === String(form.supplier_id),
      ) || null,
    [providers, form.supplier_id],
  );

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    loadData();
  }, [isOpen, paperTypeId]);

  const resetForm = () => {
    setForm(buildInitialForm());
    setProviders([]);
    setErrors({});
  };

  const loadData = async () => {
    try {
      setFetching(true);
      const [thirdsRes, paperTypeRes] = await Promise.all([
        thirdsService.getAll({ onlyActive: true }),
        isEditing
          ? paperTypesService.getById(paperTypeId)
          : Promise.resolve(null),
      ]);

      const thirds = thirdsRes?.data?.thirds || thirdsRes?.data || [];
      const providerList = thirds.filter(
        (third) => third.type_person === "PROVEEDOR",
      );
      setProviders(providerList);

      if (paperTypeRes?.data) {
        const paperType = paperTypeRes.data;
        setForm({
          name: paperType.name || "",
          description: paperType.description || "",
          grammage:
            paperType.grammage != null ? String(paperType.grammage) : "",
          is_active: paperType.is_active ?? true,
          supplier_id: "",
          supplier_price: "",
          suppliers: (paperType.suppliers || []).map((supplier) => ({
            third_id: supplier.third_id,
            purchase_price: String(supplier.purchase_price ?? ""),
            third: supplier.third,
          })),
        });
      } else {
        setForm(buildInitialForm());
      }
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

    const grammage = Number(form.grammage);
    if (!form.grammage || Number.isNaN(grammage) || grammage <= 0) {
      newErrors.grammage = "El gramaje es obligatorio y debe ser mayor a 0";
    }

    if (!form.suppliers.length) {
      newErrors.suppliers = "Debes asociar al menos un proveedor";
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
        name: form.name.trim(),
        description: form.description.trim(),
        grammage: Number(form.grammage),
        is_active: form.is_active,
        suppliers: form.suppliers.map((supplier) => ({
          third_id: supplier.third_id,
          purchase_price: Number(supplier.purchase_price),
        })),
      };

      let result;
      if (isEditing) {
        result = await paperTypesService.update(paperTypeId, payload);
        toast.success(result?.message || "Tipo de papel actualizado");
      } else {
        result = await paperTypesService.create(payload);
        toast.success(result?.message || "Tipo de papel creado");
      }

      onSuccess(result?.data || payload);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddSupplier = () => {
    const nextErrors = {};

    if (!form.supplier_id) {
      nextErrors.supplier_id = "Selecciona un proveedor";
    }

    const price = Number(form.supplier_price);
    if (!form.supplier_price || Number.isNaN(price) || price <= 0) {
      nextErrors.supplier_price = "El precio de compra debe ser mayor a 0";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    if (!selectedProvider) {
      setErrors((prev) => ({
        ...prev,
        supplier_id: "El proveedor seleccionado no es válido",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      supplier_id: "",
      supplier_price: "",
      suppliers: [
        ...prev.suppliers,
        {
          third_id: selectedProvider.id,
          purchase_price: String(price),
          third: selectedProvider,
        },
      ],
    }));

    setErrors((prev) => ({
      ...prev,
      supplier_id: "",
      supplier_price: "",
      suppliers: "",
    }));
  };

  const handleRemoveSupplier = (thirdId) => {
    setForm((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter(
        (supplier) => supplier.third_id !== thirdId,
      ),
    }));
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

      <div className="relative mx-auto max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Tipo de Papel" : "Nuevo Tipo de Papel"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos y proveedores del tipo de papel"
                : "Completa los datos para crear un tipo de papel"}
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

        <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    name="name"
                    placeholder="Ej: Cartulina"
                    value={form.name}
                    onChange={handleHeaderChange}
                    className="h-9 text-sm"
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
                    onChange={handleHeaderChange}
                    className="h-9 text-sm"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Gramaje</Label>
                  <Input
                    name="grammage"
                    placeholder="Ej: 300"
                    value={form.grammage}
                    onChange={handleHeaderChange}
                    className="h-9 text-sm"
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                  {errors.grammage && (
                    <p className="text-xs text-red-500">{errors.grammage}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <div className="flex h-9 items-center gap-2">
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
                      {form.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Proveedores
                  </h3>
                  <p className="text-xs text-slate-500">
                    Debes asociar al menos un tercero activo de tipo PROVEEDOR.
                  </p>
                </div>

                {providers.length === 0 && form.suppliers.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No hay terceros tipo PROVEEDOR activos. Primero debes crear
                    los terceros proveedores.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-[1.35fr_0.75fr_auto] md:items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Proveedor</Label>
                        <Select
                          value={form.supplier_id}
                          onValueChange={(value) => {
                            setForm((prev) => ({
                              ...prev,
                              supplier_id: value,
                            }));
                            if (errors.supplier_id) {
                              setErrors((prev) => ({
                                ...prev,
                                supplier_id: "",
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 w-full text-sm">
                            <SelectValue placeholder="Selecciona un proveedor">
                              {selectedProvider
                                ? formatProviderLabel(selectedProvider)
                                : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Proveedores disponibles</SelectLabel>
                              {availableProviders.map((provider) => (
                                <SelectItem
                                  key={provider.id}
                                  value={String(provider.id)}
                                >
                                  {formatProviderLabel(provider)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {errors.supplier_id && (
                          <p className="text-xs text-red-500">
                            {errors.supplier_id}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Precio de compra</Label>
                        <div className="flex items-center">
                          <span className="flex h-9 items-center rounded-l-md border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                            $
                          </span>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Ej: 1450"
                            value={form.supplier_price}
                            onChange={(e) => {
                              setForm((prev) => ({
                                ...prev,
                                supplier_price: e.target.value,
                              }));
                              if (errors.supplier_price) {
                                setErrors((prev) => ({
                                  ...prev,
                                  supplier_price: "",
                                }));
                              }
                            }}
                            className="h-9 rounded-l-none text-sm"
                          />
                        </div>
                        {errors.supplier_price && (
                          <p className="text-xs text-red-500">
                            {errors.supplier_price}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddSupplier}
                        className="h-9 cursor-pointer bg-white text-[#13529a] shadow-sm hover:bg-blue-50 border border-[#13529a]"
                      >
                        <Plus size={14} className="mr-2" />
                        Agregar
                      </Button>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">
                                Item
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Razón social
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Precio de compra
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.suppliers.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-sm text-slate-500"
                                >
                                  Aún no has agregado proveedores.
                                </td>
                              </tr>
                            ) : (
                              form.suppliers.map((supplier, index) => (
                                <tr
                                  key={supplier.third_id}
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-4 py-3">{index + 1}</td>
                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    {formatProviderLabel(supplier.third)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(supplier.purchase_price)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() =>
                                        handleRemoveSupplier(supplier.third_id)
                                      }
                                      className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 size={14} className="mr-2" />
                                      Eliminar
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {errors.suppliers && (
                  <p className="mt-3 text-xs text-red-500">
                    {errors.suppliers}
                  </p>
                )}
              </section>

              <div className="flex gap-3 pt-1">
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
                      {isEditing
                        ? "Actualizar Tipo de Papel"
                        : "Crear Tipo de Papel"}
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
