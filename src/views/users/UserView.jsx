import { useEffect, useState } from "react";
import userService from "../../services/user.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
        const userData = response?.data?.user || response?.user || response;

        setUser(userData);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[#13529a] text-lg font-semibold">
            Información del usuario
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#13529a]" size={32} />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Avatar + Nombre */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-[#13529a]/10 flex items-center justify-center overflow-hidden shadow">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-[#13529a]">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {user.name} {user.surename}
                </h2>

                {/* Role badge */}
                <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-[#13529a]/10 text-[#13529a] font-medium">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <User size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="text-sm font-medium">
                    {user.name} {user.surename}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Mail size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Correo electrónico</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Shield size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">Rol</p>
                  <p className="text-sm font-medium">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <IdCard size={18} className="text-[#13529a]" />
                <div>
                  <p className="text-xs text-gray-500">ID del usuario</p>
                  <p className="text-sm font-medium">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">
            No se encontró el usuario
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserView;
