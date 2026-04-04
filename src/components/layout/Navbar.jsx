import { useAuthStore } from "../../store/authStore";
import { Bell, Menu } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";

const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuthStore();
  const avatarUrl = resolveAvatarUrl(user);

  return (
    <header className="sticky top-0 z-30 border-b bg-[#13529a]">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-white sm:text-base">
              Bienvenido, {user?.name} {user?.surename}
            </h2>
            <p className="hidden text-xs text-blue-100 sm:block">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative rounded-lg p-2 transition-colors hover:bg-white/10">
            <Bell size={18} className="text-white" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
