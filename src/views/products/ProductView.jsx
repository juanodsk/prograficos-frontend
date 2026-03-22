import { useEffect, useState } from "react";
import productsService from "../../services/products.service";
import { Loader2, User, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";

const ProductView = ({ isOpen, onClose, productId }) => {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!productId || !isOpen) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsService.getById(productId);
        setProduct(response?.data?.product || response?.product || response);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el producto");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, isOpen]);

  useEffect(() => {
    if (!isOpen) setProduct(null);
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in">
        {/* Franja top */}
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-[#13529a]">
            Información del producto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#13529a]" size={32} />
            </div>
          ) : product ? (
            <div className="space-y-4">
              {/* Nombre + badge estado */}
              <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-[#13529a]/10 flex items-center justify-center">
                  <User size={24} className="text-[#13529a]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {product.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${
                    product.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {product.is_active ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {product.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Campos */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <User size={16} className="text-[#13529a] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.name}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                    product.is_active
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {product.is_active ? (
                    <CheckCircle2
                      size={16}
                      className="text-green-600 shrink-0"
                    />
                  ) : (
                    <XCircle size={16} className="text-red-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <p
                      className={`text-sm font-medium ${
                        product.is_active ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {product.is_active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No se encontró el producto
            </p>
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
};

export default ProductView;
