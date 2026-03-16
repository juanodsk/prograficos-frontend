import { useEffect, useState } from "react";
import productsService from "../../services/products.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import { Loader2, Mail, User, Shield, IdCard, X } from "lucide-react";
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
        const productData =
          response?.data?.product || response?.product || response;

        setProduct(productData);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[#13529a] text-lg font-semibold">
            Información del producto
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#13529a]" size={32} />
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Info cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <User size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  product.is_active
                    ? "bg-green-100 border-green-400"
                    : "bg-red-100 border-red-400"
                }`}
              >
                <User
                  size={18}
                  className={`${product.is_active ? "text-green-600" : "text-red-600"}`}
                />
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className="text-sm font-medium">
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
      </DialogContent>
    </Dialog>
  );
};

export default ProductView;
