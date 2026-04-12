import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import authService from "../../services/auth.service";
import { toast } from "sonner";
import { useState } from "react";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  ChevronRight,
  ChevronDown,
  Settings,
  Ruler,
  Scissors,
  FileText,
  Layers,
  UserCog,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  UserStar,
  X,
  Factory,
  ShieldUser,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"],
  },
  {
    label: "Órdenes",
    path: "/ordenes",
    icon: ClipboardList,
    roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"],
  },
  {
    label: "Monitor Planta",
    path: "/ordenes/monitor",
    icon: Factory,
    roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"],
  },

  {
    label: "Administración",
    icon: ShieldUser,
    roles: ["ADMIN", "SUPERVISOR"],
    children: [
      {
        label: "Auditoría",
        path: "/ordenes/auditoria",
        icon: ScrollText,
        roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"],
      },
    ],
  },
  {
    label: "Configuración",
    icon: Settings,
    roles: ["ADMIN", "SUPERVISOR"],
    children: [
      {
        label: "Usuarios",
        path: "/configuracion/usuarios",
        icon: UserCog,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Terceros",
        path: "/configuracion/terceros",
        icon: Building2,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Productos",
        path: "/configuracion/productos",
        icon: Package,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Productos Clientes",
        path: "/configuracion/productos_clientes",
        icon: UserStar,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Troqueles",
        path: "/configuracion/troqueles",
        icon: Scissors,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Medidas",
        path: "/configuracion/medidas",
        icon: Ruler,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Formatos",
        path: "/configuracion/formatos",
        icon: FileText,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Maquinarias",
        path: "/configuracion/maquinarias",
        icon: Factory,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Tipos de Papel",
        path: "/configuracion/tipos_papel",
        icon: Layers,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Procesos",
        path: "/configuracion/procesos",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

const isOrdersPath = (pathname) =>
  pathname === "/ordenes" ||
  pathname === "/ordenes/crear" ||
  /^\/ordenes\/\d+$/.test(pathname) ||
  /^\/ordenes\/\d+\/editar$/.test(pathname);

const isMenuItemActive = (itemPath, pathname) => {
  if (itemPath === "/ordenes") {
    return isOrdersPath(pathname);
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const avatarUrl = resolveAvatarUrl(user);

  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({ Administración: true });

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate("/login");
      toast.success("Sesión cerrada exitosamente");
    } catch {
      logout();
      navigate("/login");
    }
  };

  const toggleMenu = (label, isMobile = false) => {
    if (!isMobile && collapsed) {
      setCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [label]: true }));
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleNavigate = () => {
    onCloseMobile?.();
  };

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const renderMenu = (isMobile = false) => (
    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
      {filteredMenu.map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) =>
            child.roles.includes(user?.role),
          );

          const isOpen = openMenus[item.label] && (isMobile || !collapsed);
          const isActive = filteredChildren.some((child) =>
            location.pathname.startsWith(child.path),
          );

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleMenu(item.label, isMobile)}
                title={!isMobile && collapsed ? item.label : ""}
                className={`w-full cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-[#13529a]/10 font-medium text-[#13529a] cursor-pointer"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                } ${!isMobile && collapsed ? "flex justify-center" : "flex items-center gap-3"}`}
              >
                <item.icon size={18} />

                {(isMobile || !collapsed) && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </>
                )}
              </button>

              {isOpen && (isMobile || !collapsed) && (
                <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                  {filteredChildren.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      onClick={handleNavigate}
                      className={({ isActive: childActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                          childActive
                            ? "bg-[#13529a]/10 font-medium text-[#13529a] cursor-pointer"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                        }`
                      }
                    >
                      <child.icon size={16} />
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavigate}
            title={!isMobile && collapsed ? item.label : ""}
            className={() =>
              `rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                isMenuItemActive(item.path, location.pathname)
                  ? "bg-[#13529a]/10 font-medium text-[#13529a] cursor-pointer"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              } ${!isMobile && collapsed ? "flex justify-center" : "flex items-center gap-3"}`
            }
          >
            <item.icon size={18} />
            {(isMobile || !collapsed) && (
              <span className="flex-1">{item.label}</span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const renderFooter = (isMobile = false) => (
    <div className="border-t p-3">
      {(isMobile || !collapsed) && (
        <div className="mb-1 flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#13529a]/10">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      )}

      {!isMobile && collapsed && (
        <div className="mb-1 flex justify-center">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#13529a]/10">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        title={!isMobile && collapsed ? "Cerrar sesión" : ""}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 ${
          !isMobile && collapsed ? "justify-center" : ""
        }`}
      >
        <LogOut size={18} />
        {(isMobile || !collapsed) && <span>Cerrar sesión</span>}
      </button>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden h-screen shrink-0 border-r bg-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:flex lg:flex-col ${
          collapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex min-h-16 items-center justify-between border-b p-4">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <img
                  src="/logo_pr.png"
                  alt="Prograficos"
                  className="h-10 w-10 shrink-0 rounded-xl object-contain"
                />
                <div>
                  <h1 className="text-sm font-bold leading-tight text-gray-900">
                    Prográficos
                  </h1>
                  <span className="rounded-full bg-[#13529a]/10 px-1.5 py-0.5 text-xs font-medium text-[#13529a]">
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#13529a]"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <img
              src="/logo_pr.png"
              alt="Prograficos"
              className="mx-auto h-10 w-10 rounded-xl object-contain"
            />
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#13529a]"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {renderMenu(false)}
        {renderFooter(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          />

          <aside className="relative flex h-full w-[85vw] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex min-h-16 items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logo_pr.png"
                  alt="Prograficos"
                  className="h-10 w-10 shrink-0 rounded-xl object-contain"
                />
                <div>
                  <h1 className="text-sm font-bold leading-tight text-gray-900">
                    Prográficos
                  </h1>
                  <span className="rounded-full bg-[#13529a]/10 px-1.5 py-0.5 text-xs font-medium text-[#13529a]">
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#13529a]"
              >
                <X size={18} />
              </button>
            </div>

            {renderMenu(true)}
            {renderFooter(true)}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
