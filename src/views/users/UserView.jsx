import { useEffect, useState } from "react";
import userService from "../../services/user.service";
import { Loader2, Mail, User, Shield, IdCard, X } from "lucide-react";
import { toast } from "sonner";

const roleLabels = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  EMPLOYEE: "Empleado",
  USER: "Usuario",
};

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
  }, [userId, isOpen, onClose]);

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

  const fullName = user ? `${user.name || ""} ${user.surename || ""}`.trim() : "";
  const initials = user
    ? `${user.name?.charAt(0) || ""}${user.surename?.charAt(0) || ""}`.trim() ||
      user.name?.charAt(0)?.toUpperCase() ||
      "U"
    : "U";
  const roleLabel = roleLabels[user?.role] || user?.role || "Sin rol";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              Información del usuario
            </h2>
            <p className="text-xs text-slate-400">
              Consulta los datos principales del perfil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#13529a]" size={32} />
            </div>
          ) : user ? (
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="overflow-hidden rounded-3xl bg-[linear-gradient(145deg,#0f3f7a_0%,#13529a_52%,#2b6cb0_100%)] p-6 text-white shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/15 shadow-lg backdrop-blur">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {initials}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {fullName}
                  </h3>
                  <p className="mt-1 text-sm text-blue-100">
                    Perfil de acceso del sistema
                  </p>
                  <span className="mt-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {roleLabel}
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100/80">
                      Correo
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-white">
                      {user.email || "Sin correo"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100/80">
                      Identificador
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      #{user.id}
                    </p>
                  </div>
                </div>
              </aside>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Resumen
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Información general del usuario registrada en plataforma.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#13529a]/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#13529a]/10">
                      <User size={18} className="shrink-0 text-[#13529a]" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Nombre
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {fullName}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#13529a]/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#13529a]/10">
                      <Mail size={18} className="shrink-0 text-[#13529a]" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Correo electrónico
                    </p>
                    <p className="mt-1 break-all text-base font-semibold text-slate-900">
                      {user.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#13529a]/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#13529a]/10">
                      <Shield size={18} className="shrink-0 text-[#13529a]" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Rol
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {roleLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#13529a]/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#13529a]/10">
                      <IdCard size={18} className="shrink-0 text-[#13529a]" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      ID del usuario
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {user.id}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Acceso
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Este usuario tiene el rol de{" "}
                      <span className="font-semibold text-slate-900">
                        {roleLabel.toLowerCase()}
                      </span>{" "}
                      y está identificado internamente con el código{" "}
                      <span className="font-semibold text-slate-900">
                        #{user.id}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-gray-500">
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
