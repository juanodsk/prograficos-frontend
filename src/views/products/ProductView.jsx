import { useEffect, useState } from "react";
import productsService from "../../services/products.service";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Package,
  Building2,
  Scissors,
  FileText,
  CalendarDays,
  Ruler,
  Mail,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

const formatTroquelLabel = (troquel) => {
  if (!troquel) return "Troquel sin asignar";
  return troquel.code || troquel.file_name || `Troquel #${troquel.id}`;
};

const formatThirdLabel = (third) => {
  if (!third) return "Tercero sin asignar";
  return third.company_name || third.name || `Tercero #${third.id}`;
};

const sizeConfig = {
  SMALL: {
    label: "Pequeño",
    className: "bg-blue-100 text-blue-800",
  },
  MEDIUM: {
    label: "Mediano",
    className: "bg-red-100 text-red-800",
  },
  LARGE: {
    label: "Grande",
    className: "bg-green-100 text-green-800",
  },
};

const formatTroquelSize = (size) => sizeConfig[size]?.label || size || "Sin tamaño";

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
  }, [productId, isOpen, onClose]);

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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-bold text-[#13529a]">
            Información del producto
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#13529a]" size={32} />
            </div>
          ) : product ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2 border-b pb-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#13529a]/10">
                  <Package size={24} className="text-[#13529a]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {product.name || formatThirdLabel(product.third)}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatTroquelLabel(product.troquel)}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
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

              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Package size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre del producto</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.name || "Sin nombre"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Building2 size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatThirdLabel(product.third)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Scissors size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Troquel</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTroquelLabel(product.troquel)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Ruler size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Tamaño del troquel</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        sizeConfig[product.troquel?.size]?.className ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {formatTroquelSize(product.troquel?.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <FileText size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Archivo asociado</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.troquel?.file_name || "Sin archivo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <CalendarDays
                    size={16}
                    className="shrink-0 text-[#13529a]"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Fecha de elaboración</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.troquel?.elaboration_date
                        ? new Date(
                            product.troquel.elaboration_date,
                          ).toLocaleDateString()
                        : "Sin fecha"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Hash size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Documento cliente</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.third?.document_number || "Sin documento"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <Mail size={16} className="shrink-0 text-[#13529a]" />
                  <div>
                    <p className="text-xs text-gray-500">Correo cliente</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.third?.email || "Sin correo"}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    product.is_active
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  {product.is_active ? (
                    <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-red-500" />
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
            <p className="py-6 text-center text-gray-500">
              Producto no encontrado
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
