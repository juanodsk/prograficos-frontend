import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Login from "../views/auth/Login";
import Landing from "../views/landing/Landing";
import Dashboard from "../views/dashboard/Dashboard";
import Users from "../views/users/Users";
import Roles from "../views/security/Roles";
import RolePermissions from "../views/security/RolePermissions";
import Orders from "../views/orders/Orders";
import OrdersAudit from "../views/orders/OrdersAudit";
import OrderForm from "../views/orders/OrderForm";
import OrderDetail from "../views/orders/OrderDetail";
import ProductionBoard from "../views/orders/ProductionBoard";
import Thirds from "../views/thirds/Thirds";
import Products from "../views/products/Products";
import Troqueles from "../views/troqueles/Troqueles";
import Measures from "../views/measures/Measures";
import Formats from "../views/formats/Formats";
import PaperTypes from "../views/paper_types/PaperTypes";
import Processes from "../views/processes/Processes";
import Machinery from "../views/machinery/Machinery";

import Unauthorized from "../views/Unauthorized";

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  // Rutas para todos los autenticados
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [{ path: "dashboard", element: <Dashboard /> }],
  },
  // Terceros / Productos / Troqueles: acceso por permiso de "ver". ADMIN pasa siempre.
  {
    path: "/",
    element: <ProtectedRoute permissions={["thirds:view"]} />,
    children: [{ path: "/configuracion/terceros", element: <Thirds /> }],
  },
  {
    path: "/",
    element: <ProtectedRoute permissions={["products:view"]} />,
    children: [{ path: "/configuracion/productos", element: <Products /> }],
  },
  {
    path: "/",
    element: <ProtectedRoute permissions={["troqueles:view"]} />,
    children: [{ path: "/configuracion/troqueles", element: <Troqueles /> }],
  },
  // Catálogos: acceso por permiso (catalogs:view). ADMIN pasa siempre.
  {
    path: "/",
    element: <ProtectedRoute permissions={["catalogs:view"]} />,
    children: [
      {
        path: "/configuracion/medidas",
        element: <Measures />,
      },
      {
        path: "/configuracion/formatos",
        element: <Formats />,
      },
      {
        path: "/configuracion/maquinarias",
        element: <Machinery />,
      },
      {
        path: "/configuracion/tipos_papel",
        element: <PaperTypes />,
      },
      {
        path: "/configuracion/procesos",
        element: <Processes />,
      },
    ],
  },
  // Zona de Seguridad: solo ADMIN
  {
    path: "/",
    element: <ProtectedRoute roles={["ADMIN"]} />,
    children: [
      { path: "/seguridad/usuarios", element: <Users /> },
      { path: "/seguridad/roles", element: <Roles /> },
      { path: "/seguridad/permisos", element: <RolePermissions /> },
      // Compatibilidad: la antigua ruta de usuarios ahora vive en Seguridad.
      {
        path: "/configuracion/usuarios",
        element: <Navigate to="/seguridad/usuarios" replace />,
      },
    ],
  },
  // Órdenes: acceso por permiso. ADMIN pasa siempre.
  // Ver/abrir una orden: cualquiera del flujo de órdenes.
  {
    path: "/",
    element: (
      <ProtectedRoute
        permissions={[
          "orders:view",
          "orders:create",
          "orders:update",
          "orders:operate",
          "orders:finish",
        ]}
      />
    ),
    children: [
      { path: "ordenes", element: <Orders /> },
      { path: "ordenes/:id", element: <OrderDetail /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute permissions={["orders:create"]} />,
    children: [{ path: "ordenes/crear", element: <OrderForm /> }],
  },
  {
    path: "/",
    element: <ProtectedRoute permissions={["orders:update"]} />,
    children: [{ path: "ordenes/:id/editar", element: <OrderForm /> }],
  },
  // Auditoría: acceso por permiso audit:view (hoy solo ADMIN/SUPERVISOR lo tienen).
  {
    path: "/",
    element: <ProtectedRoute permissions={["audit:view"]} />,
    children: [{ path: "ordenes/auditoria", element: <OrdersAudit /> }],
  },
  {
    path: "/",
    element: <ProtectedRoute permissions={["monitor:view"]} withoutShell />,
    children: [{ path: "ordenes/monitor", element: <ProductionBoard /> }],
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <Navigate to="/login" />,
  },
]);

export default router;
