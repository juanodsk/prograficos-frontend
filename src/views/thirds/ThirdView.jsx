import { useEffect, useState } from "react";
import thirdsService from "../../services/thirds.service";
import {
  Loader2,
  Mail,
  User,
  Shield,
  IdCard,
  MapPin,
  Building2,
  Phone,
  X,
} from "lucide-react";
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
        setThird(response?.data?.third || response);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el tercero");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchThird();
  }, [thirdId, isOpen]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) setThird(null);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fields = third
    ? [
        { icon: User, label: "Nombre", value: third.name },
        { icon: Mail, label: "Correo electrónico", value: third.email },
        { icon: Phone, label: "Teléfono", value: third.phone },
        { icon: MapPin, label: "Dirección", value: third.address },
        { icon: Building2, label: "Empresa", value: third.company_name },
        { icon: Shield, label: "Tipo de persona", value: third.type_person },
        { icon: IdCard, label: "ID del tercero", value: third.id },
      ].filter((f) => f.value)
    : [];

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
            Información del tercero
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
          ) : third ? (
            <div className="space-y-4">
              {/* Nombre + badge tipo */}
              <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-[#13529a]/10 flex items-center justify-center">
                  <User size={24} className="text-[#13529a]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {third.name}
                </h3>
                <span className="text-xs px-3 py-1 rounded-full bg-[#13529a]/10 text-[#13529a] font-medium">
                  {third.type_person}
                </span>
              </div>

              {/* Campos */}
              <div className="space-y-2">
                {fields.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon size={16} className="text-[#13529a] shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No se encontró el tercero
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

export default ThirdView;
