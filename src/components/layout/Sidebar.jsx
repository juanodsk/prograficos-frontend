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
    roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE"],
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
        label: "Troqueles",
        path: "/admin/troqueles",
        icon: Scissors,
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Medidas",
        path: "/admin/medidad",
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
        label: "Tipos de Papel",
        path: "/admin/tipos_de_papel",
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

const Sidebar = () => {
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
    } catch (error) {
      logout();
      navigate("/login");
    }
  };

  const toggleMenu = (label) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-white border-r flex flex-col h-full transition-all duration-300 ease-in-out`}
    >
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between min-h-16">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#13529a] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Prográficos
              </h1>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#13529a]/10 text-[#13529a]">
                {user?.role}
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#13529a] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">P</span>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#13529a] transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#13529a] transition-colors"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {filteredMenu.map((item) => {
          if (item.children) {
            const filteredChildren = item.children.filter((child) =>
              child.roles.includes(user?.role),
            );
            const isOpen = openMenus[item.label] && !collapsed;
            const isActive = filteredChildren.some((child) =>
              location.pathname.startsWith(child.path),
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  title={collapsed ? item.label : ""}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#13529a]/10 text-[#13529a] font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && (
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

                {isOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                    {filteredChildren.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-[#13529a]/10 text-[#13529a] font-medium"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          }`
                        }
                      >
                        <child.icon size={16} className="shrink-0" />
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
              title={collapsed ? item.label : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#13529a]/10 text-[#13529a] font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Usuario + Logout */}
      <div className="p-3 border-t">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#13529a]/10 flex items-center justify-center text-sm font-medium text-[#13529a] shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full bg-[#13529a]/10 flex items-center justify-center text-sm font-medium text-[#13529a]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar sesión" : ""}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
