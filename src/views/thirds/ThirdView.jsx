import { useEffect, useState } from "react";
import thirdsService from "../../services/thirds.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import { Loader2, Mail, User, Shield, IdCard, X } from "lucide-react";
import { toast } from "sonner";

const ThirdView = ({ isOpen, onClose, thirdId }) => {
  const [loading, setLoading] = useState(false);
  const [third, setThird] = useState(null);

  useEffect(() => {
    if (!thirdId || !isOpen) return;

    const fetchThird = async () => {
      try {
        setLoading(true);

        const response = await thirdsService.getById(thirdId);
        const thirdData = response?.data?.third || response;

        setThird(thirdData);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el tercero");
      } finally {
        setLoading(false);
      }
    };

    fetchThird();
  }, [thirdId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[#13529a] text-lg font-semibold">
            Información del tercero
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#13529a]" size={32} />
          </div>
        ) : third ? (
          <div className="space-y-6">
            {/* Avatar + Nombre */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{third.name}</h2>

                {/* Role badge */}
                <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-[#13529a]/10 text-[#13529a] font-medium">
                  {third.type_person}
                </span>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <User size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="text-sm font-medium">{third.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Mail size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Correo electrónico</p>
                  <p className="text-sm font-medium">{third.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Shield size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Rol</p>
                  <p className="text-sm font-medium">{third.type_person}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <IdCard size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">ID del tercero</p>
                  <p className="text-sm font-medium">{third.id}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">
            No se encontró el tercero
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ThirdView;
