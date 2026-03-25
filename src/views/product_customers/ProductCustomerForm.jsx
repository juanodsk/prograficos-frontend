import { useState, useEffect } from "react";
import { toast } from "sonner";
import productCustomerService from "../../services/product_customer.service";
import productsService from "../../services/products.service";
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

export default function ProductCustomerForm({
  isOpen,
  onClose,
  onSuccess,
  productCustomerId,
}) {
  const isEditing = !!productCustomerId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [products, setProducts] = useState([]);
  const [thirds, setThirds] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    product_id: "",
    third_id: "",
  });

  useEffect(() => {
    if (isOpen) loadData();
    if (!isOpen) resetForm();
  }, [isOpen, productCustomerId]);

  const resetForm = () => {
    setForm({ name: "", product_id: "", third_id: "" });
    setErrors({});
  };

  const loadData = async () => {
    try {
      setFetching(true);
      const [productsRes, thirdsRes, productCustomerRes] = await Promise.all([
        productsService.getAll(),
        thirdsService.getAll(),
        isEditing
          ? productCustomerService.getById(productCustomerId)
          : Promise.resolve(null),
      ]);

      setProducts(productsRes?.data?.products || productsRes?.data || []);
      setThirds(thirdsRes?.data?.thirds || thirdsRes?.data || []);

      if (productCustomerRes) {
        const pc =
          productCustomerRes?.data?.product_customer ||
          productCustomerRes?.data ||
          productCustomerRes;
        setForm({
          name: pc.name || "",
          product_id: pc.product_id ? String(pc.product_id) : "",
          third_id: pc.third_id ? String(pc.third_id) : "",
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
    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
    if (!form.product_id) newErrors.product_id = "Selecciona un producto";
    if (!form.third_id) newErrors.third_id = "Selecciona un cliente";
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
        product_id: parseInt(form.product_id),
        third_id: parseInt(form.third_id),
      };
      let result;
      if (isEditing) {
        result = await productCustomerService.update(
          productCustomerId,
          payload,
        );
        toast.success("Producto de cliente actualizado");
      } else {
        result = await productCustomerService.create(payload);
        toast.success("Producto de cliente creado");
      }
      onSuccess(result?.data?.product_customer || result?.data || payload);
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              {isEditing
                ? "Editar Producto de Cliente"
                : "Nuevo Producto de Cliente"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEditing
                ? "Modifica los datos del producto"
                : "Completa los datos para crear el producto"}
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
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  name="name"
                  placeholder="Ej: Volante Empresa ABC"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className="h-8 text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Producto */}
              <div className="space-y-1">
                <Label className="text-xs">Producto</Label>
                <Select
                  value={form.product_id}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, product_id: value }));
                    if (errors.product_id)
                      setErrors((prev) => ({ ...prev, product_id: "" }));
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue>
                      {products.find((p) => String(p.id) === form.product_id)
                        ?.name || "Selecciona un producto"}
                    </SelectValue>{" "}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Productos disponibles</SelectLabel>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.product_id && (
                  <p className="text-xs text-red-500">{errors.product_id}</p>
                )}
              </div>

              {/* Cliente (Tercero) */}
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Select
                  value={form.third_id}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, third_id: value }));
                    if (errors.third_id)
                      setErrors((prev) => ({ ...prev, third_id: "" }));
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue>
                      {thirds.find((t) => String(t.id) === form.third_id)
                        ? `${thirds.find((t) => String(t.id) === form.third_id)?.name}${thirds.find((t) => String(t.id) === form.third_id)?.company_name ? ` — ${thirds.find((t) => String(t.id) === form.third_id)?.company_name}` : ""}`
                        : "Selecciona un cliente"}
                    </SelectValue>{" "}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Clientes disponibles</SelectLabel>
                      {thirds.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                          {t.company_name ? ` — ${t.company_name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.third_id && (
                  <p className="text-xs text-red-500">{errors.third_id}</p>
                )}
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
