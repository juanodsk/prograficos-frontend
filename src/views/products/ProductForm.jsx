// src/components/common/UserFormModal.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import productsService from "../../services/products.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { X, Loader2, Save, User } from "lucide-react";

/**
 * ProductForm
 *
 * Props:
 *  - isOpen     {boolean}        Controla visibilidad
 *  - onClose    {function}       Cierra el modal
 *  - onSuccess  {function(product)} Se llama tras crear/editar exitosamente
 *  - productId  {number|null}    Si tiene valor → modo edición
 */
export default function ProductForm({ isOpen, onClose, onSuccess, productId }) {
  const isEditing = !!productId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    is_active: true,
  });

  // Cargar datos cuando es edición
  useEffect(() => {
    if (isOpen && isEditing) {
      fetchProduct();
    }
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, productId]);

  const resetForm = () => {
    setForm({
      name: "",
      is_active: true,
    });
    setErrors({});
  };

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const data = await productsService.getById(productId);
      const p = data.data.product;

      setForm({
        name: p.name || "",
        is_active: p.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el producto");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es requerido";
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
        is_active: form.is_active,
      };

      let result;

      if (isEditing) {
        result = await productsService.update(productId, payload);
        toast.success("Producto actualizado");
      } else {
        result = await productsService.create(payload);
        toast.success("Producto creado");
      }

      onSuccess(result?.data?.product || payload);
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
        {/* Franja top */}
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-[#13529a]">
                {isEditing ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing
                  ? "Modifica los datos del producto"
                  : "Completa los datos para crear un producto"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} className="cursor-pointer" />
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
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    name="name"
                    placeholder="Caja de Cartón"
                    value={form.name}
                    onChange={handleChange}
                    className="h-8 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="mt-3">
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
                      {isEditing ? "Actualizar" : "Crear Producto"}
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
