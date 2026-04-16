import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import productsService from "../../services/products.service";
import troquelesService from "../../services/troqueles.service";
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
import { X, Loader2, Save } from "lucide-react";

const formatTroquelLabel = (troquel) => {
  if (!troquel) return "Troquel sin asignar";
  return troquel.code || troquel.file_name || `Troquel #${troquel.id}`;
};

const formatThirdLabel = (third) => {
  if (!third) return "Tercero sin asignar";
  return third.company_name || third.name || `Tercero #${third.id}`;
};

export default function ProductForm({ isOpen, onClose, onSuccess, productId }) {
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
    }
  }, [isOpen, productId]);

  const resetForm = () => {
    setForm({
      name: "",
      troquel_id: "",
      third_id: "",
      is_active: true,
    });
    setErrors({});
  };

  const loadCatalogs = async () => {
    try {
      setCatalogLoading(true);
      const [troquelesRes, thirdsRes] = await Promise.all([
        troquelesService.getAll({ onlyActive: true, pageSize: 1000 }),
        thirdsService.getAll({ onlyActive: true, pageSize: 1000 }),
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
        third_id: product?.third_id ? String(product.third_id) : "",
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
      catalogs.troqueles.find((troquel) => String(troquel.id) === form.troquel_id) ||
      null,
    [catalogs.troqueles, form.troquel_id],
  );

  const selectedThird = useMemo(
    () =>
      catalogs.thirds.find((third) => String(third.id) === form.third_id) || null,
    [catalogs.thirds, form.third_id],
  );

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
        is_active: form.is_active,
      };

      const result = isEditing
        ? await productsService.update(productId, payload)
        : await productsService.create(payload);

      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      onSuccess(result?.data?.product || payload);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error al guardar el producto");
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

      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-6 py-4">
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

        <div className="px-6 py-5">
          {fetching || catalogLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del producto</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ej: Caja plegadiza 12oz"
                />
              </div>

              <div className="space-y-2">
                <Label>Troquel</Label>
                <Select
                  value={form.troquel_id}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, troquel_id: value }));
                    if (errors.troquel_id) {
                      setErrors((prev) => ({ ...prev, troquel_id: "" }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un troquel">
                      {selectedTroquel ? formatTroquelLabel(selectedTroquel) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Troqueles disponibles</SelectLabel>
                      {catalogs.troqueles.map((troquel) => (
                        <SelectItem key={troquel.id} value={String(troquel.id)}>
                          {formatTroquelLabel(troquel)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.troquel_id && (
                  <p className="text-xs text-red-500">{errors.troquel_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tercero</Label>
                <Select
                  value={form.third_id}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, third_id: value }));
                    if (errors.third_id) {
                      setErrors((prev) => ({ ...prev, third_id: "" }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un tercero">
                      {selectedThird ? formatThirdLabel(selectedThird) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Terceros disponibles</SelectLabel>
                      {catalogs.thirds.map((third) => (
                        <SelectItem key={third.id} value={String(third.id)}>
                          {formatThirdLabel(third)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.third_id && (
                  <p className="text-xs text-red-500">{errors.third_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
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
                <span className="ml-2 text-sm text-gray-700">
                  {form.is_active ? "Activo" : "Inactivo"}
                </span>
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
