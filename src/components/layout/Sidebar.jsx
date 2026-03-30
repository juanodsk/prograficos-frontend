import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import authService from "../../services/auth.service";
import { toast } from "sonner";
import { useState } from "react";
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
  UserStar,
  X,
  Factory,
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
    icon: Settings,
    roles: ["ADMIN", "SUPERVISOR"],
    children: [
      {
        label: "Usuarios",
        path: "/admin/usuarios",
        icon: UserCog,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Terceros",
        path: "/admin/terceros",
        icon: Building2,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Productos",
        path: "/admin/productos",
        icon: Package,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Productos Clientes",
        path: "/admin/productos_clientes",
        icon: UserStar,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Troqueles",
        path: "/admin/troqueles",
        icon: Scissors,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Medidas",
        path: "/admin/medidas",
        icon: Ruler,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Formatos",
        path: "/admin/formatos",
        icon: FileText,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Maquinarias",
        path: "/admin/maquinarias",
        icon: Factory,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Tipos de Papel",
        path: "/admin/tipos_papel",
        icon: Layers,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Procesos",
        path: "/admin/procesos",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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
                    ? "bg-[#13529a]/10 font-medium text-[#13529a]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } ${!isMobile && collapsed ? "flex justify-center" : "flex items-center gap-3"}`}
              >
                <item.icon size={18} />

                {(isMobile || !collapsed) && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          childActive
                            ? "bg-[#13529a]/10 font-medium text-[#13529a]"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[#13529a]/10 font-medium text-[#13529a]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } ${!isMobile && collapsed ? "flex justify-center" : "flex items-center gap-3"}`
            }
          >
            <item.icon size={18} />
            {(isMobile || !collapsed) && <span className="flex-1">{item.label}</span>}
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
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      )}

      {!isMobile && collapsed && (
        <div className="mb-1 flex justify-center">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#13529a]/10">
            {user?.avatar && (
              <img
                src={user.avatar}
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
        className={`hidden h-screen border-r bg-white transition-all duration-300 ease-in-out lg:flex lg:flex-col ${
          collapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex min-h-16 items-center justify-between border-b p-4">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#13529a]">
                  <span className="text-sm font-bold text-white">P</span>
                </div>
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
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#13529a]">
              <span className="text-sm font-bold text-white">P</span>
            </div>
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#13529a]">
                  <span className="text-sm font-bold text-white">P</span>
                </div>
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
