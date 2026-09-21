import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import productsService from "../../services/products.service";
import troquelesService from "../../services/troqueles.service";
import thirdsService from "../../services/thirds.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTroquelLabel } from "@/lib/troquel";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { X, Loader2, Save } from "lucide-react";

const formatThirdLabel = (third) => {
  if (!third) return "Tercero sin asignar";
  return third.company_name || third.name || `Tercero #${third.id}`;
};

// El precio (Decimal) puede llegar como "15000" o "15000.00": lo mostramos como
// entero de pesos (COP sin decimales) en el input.
const toPesoInput = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? String(n) : "";
};

export default function ProductForm({
  isOpen,
  onClose,
  onSuccess,
  productId,
  defaultThirdId = null,
  lockThird = false,
}) {
  const isEditing = Boolean(productId);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [catalogs, setCatalogs] = useState({ troqueles: [], thirds: [] });
  const [form, setForm] = useState({
    name: "",
    troquel_id: "",
    third_id: "",
    sale_price: "",
    is_active: true,
  });

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    loadCatalogs();

    if (isEditing) {
      fetchProduct();
    } else {
      // Al abrir para crear, inicializa el form tomando el tercero actual
      // (defaultThirdId ya está disponible cuando se abre desde ThirdView).
      resetForm();
    }
  }, [isOpen, productId]);

  const resetForm = () => {
    setForm({
      name: "",
      troquel_id: "",
      third_id: defaultThirdId ? String(defaultThirdId) : "",
      sale_price: "",
      is_active: true,
    });
    setErrors({});
  };

  const loadCatalogs = async () => {
    try {
      setCatalogLoading(true);
      const [troquelesRes, thirdsRes] = await Promise.all([
        troquelesService.getAll({ onlyActive: true, pageSize: 1000 }),
        lockThird
          ? Promise.resolve({ data: { thirds: [] } })
          : thirdsService.getAll({ onlyActive: true, pageSize: 1000 }),
      ]);

      setCatalogs({
        troqueles: troquelesRes?.data || [],
        thirds: thirdsRes?.data?.thirds || thirdsRes?.data || [],
      });
    } catch {
      toast.error("Error al cargar los catálogos");
      onClose();
    } finally {
      setCatalogLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const response = await productsService.getById(productId);
      const product = response?.data?.product;

      setForm({
        name: product?.name || "",
        troquel_id: product?.troquel_id ? String(product.troquel_id) : "",
        third_id: product?.third_id
          ? String(product.third_id)
          : defaultThirdId
            ? String(defaultThirdId)
            : "",
        sale_price: toPesoInput(product?.sale_price),
        is_active: product?.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el producto");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const selectedTroquel = useMemo(
    () =>
      catalogs.troqueles.find(
        (troquel) => String(troquel.id) === form.troquel_id,
      ) || null,
    [catalogs.troqueles, form.troquel_id],
  );

  const selectedThird = useMemo(() => {
    if (defaultThirdId && String(defaultThirdId) === form.third_id) {
      return {
        id: defaultThirdId,
        name: "",
        company_name: "",
      };
    }

    return (
      catalogs.thirds.find((third) => String(third.id) === form.third_id) ||
      null
    );
  }, [catalogs.thirds, defaultThirdId, form.third_id]);

  const validate = () => {
    const nextErrors = {};

    if (!form.troquel_id) {
      nextErrors.troquel_id = "Selecciona un troquel";
    }

    if (!form.third_id) {
      nextErrors.third_id = "Selecciona un tercero";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim() || null,
        troquel_id: Number(form.troquel_id),
        third_id: Number(form.third_id),
        sale_price: form.sale_price === "" ? null : Number(form.sale_price),
        is_active: form.is_active,
      };

      const result = isEditing
        ? await productsService.update(productId, payload)
        : await productsService.create(payload);

      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      onSuccess(result?.data?.product || payload);
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error al guardar el producto",
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

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Actualiza la relación entre troquel y tercero"
                : "Crea una nueva relación entre troquel y tercero"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} className="cursor-pointer" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {fetching || catalogLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Resumen del vínculo
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Cliente
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {lockThird
                          ? "Cliente actual"
                          : selectedThird
                            ? formatThirdLabel(selectedThird)
                            : "Sin seleccionar"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Troquel
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedTroquel
                          ? formatTroquelLabel(selectedTroquel)
                          : "Sin seleccionar"}
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
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
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nombre del producto</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Ej: Caja plegadiza 12oz"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Troquel</Label>
                    <Combobox
                      items={catalogs.troqueles}
                      itemToStringValue={(troquel) => formatTroquelLabel(troquel)}
                      value={selectedTroquel ?? null}
                      onValueChange={(troquel) => {
                        if (troquel) {
                          setForm((prev) => ({ ...prev, troquel_id: String(troquel.id) }));
                        } else {
                          setForm((prev) => ({ ...prev, troquel_id: "" }));
                        }
                        if (errors.troquel_id) {
                          setErrors((prev) => ({ ...prev, troquel_id: "" }));
                        }
                      }}
                    >
                      <ComboboxInput placeholder="Buscar troquel..." showClear />
                      <ComboboxContent>
                        <ComboboxEmpty>No se encontró ningún troquel.</ComboboxEmpty>
                        <ComboboxList>
                          {(troquel) => (
                            <ComboboxItem key={troquel.id} value={formatTroquelLabel(troquel)}>
                              {formatTroquelLabel(troquel)}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errors.troquel_id && (
                      <p className="text-xs text-red-500">
                        {errors.troquel_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tercero</Label>
                    {lockThird ? (
                      <div className="rounded-lg border bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                        Este producto quedará asociado al cliente actual.
                      </div>
                    ) : (
                      <Combobox
                        items={catalogs.thirds}
                        itemToStringValue={(third) => formatThirdLabel(third)}
                        value={selectedThird ?? null}
                        onValueChange={(third) => {
                          if (third) {
                            setForm((prev) => ({ ...prev, third_id: String(third.id) }));
                          } else {
                            setForm((prev) => ({ ...prev, third_id: "" }));
                          }
                          if (errors.third_id) {
                            setErrors((prev) => ({ ...prev, third_id: "" }));
                          }
                        }}
                      >
                        <ComboboxInput placeholder="Buscar tercero..." showClear />
                        <ComboboxContent>
                          <ComboboxEmpty>No se encontró ningún tercero.</ComboboxEmpty>
                          <ComboboxList>
                            {(third) => (
                              <ComboboxItem key={third.id} value={formatThirdLabel(third)}>
                                {formatThirdLabel(third)}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    )}
                    {errors.third_id && (
                      <p className="text-xs text-red-500">{errors.third_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Precio de venta (opcional)</Label>
                    <div className="flex items-center">
                      <span className="flex h-9 min-w-9 items-center justify-center rounded-l-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                        $
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 15000"
                        value={form.sale_price}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setForm((prev) => ({ ...prev, sale_price: digits }));
                        }}
                        className="h-9 rounded-l-none border-slate-300 text-sm"
                      />
                    </div>
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
                      {isEditing ? "Actualizar Producto" : "Crear Producto"}
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
