import { useAuthStore } from "../../store/authStore";
import { Bell } from "lucide-react";

const Navbar = () => {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-[#13529a] border-b flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-white">
          Bienvenido, {user?.name} {user?.surename}
        </h2>
        <p className="text-xs text-gray-300">
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100  transition-colors">
          <Bell size={18} className="text-white hover:text-gray-900" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
