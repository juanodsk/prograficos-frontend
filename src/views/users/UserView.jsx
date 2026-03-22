import { useEffect, useState } from "react";
import userService from "../../services/user.service";
import { Loader2, Mail, User, Shield, IdCard, X } from "lucide-react";
import { toast } from "sonner";

const UserView = ({ isOpen, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId || !isOpen) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(userId);
        setUser(response?.data?.user || response?.user || response);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el usuario");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, isOpen]);

  useEffect(() => {
    if (!isOpen) setUser(null);
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
            Información del usuario
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
          ) : user ? (
            <div className="space-y-4">
              {/* Avatar + Nombre + badge */}
              <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-[#13529a]/10 flex items-center justify-center overflow-hidden shadow">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[#13529a]">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {user.name} {user.surename}
                </h3>
                <span className="text-xs px-3 py-1 rounded-full bg-[#13529a]/10 text-[#13529a] font-medium">
                  {user.role}
                </span>
              </div>

              {/* Campos */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <User size={16} className="text-[#13529a] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name} {user.surename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Mail size={16} className="text-[#13529a] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Correo electrónico</p>
                    <p className="text-sm font-medium text-gray-900">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Shield size={16} className="text-[#13529a] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Rol</p>
                    <p className="text-sm font-medium text-gray-900">
                      {user.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <IdCard size={16} className="text-[#13529a] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">ID del usuario</p>
                    <p className="text-sm font-medium text-gray-900">
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">
              No se encontró el usuario
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

export default UserView;
