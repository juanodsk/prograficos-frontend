import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Login from "../views/auth/Login";
import Landing from "../views/landing/Landing";
import Dashboard from "../views/dashboard/Dashboard";
import Users from "../views/users/Users";
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
import ProductCustomers from "../views/product_customers/ProductCustomers";
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
  // Rutas solo para ADMIN y SUPERVISOR
  {
    path: "/",
    element: <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]} />,
    children: [
      { path: "/configuracion/usuarios", element: <Users /> },
      // Redirigen al modal que está en la lista
      {
        path: "/configuracion/usuario/create",
        element: <Navigate to="/configuracion/usuarios" replace />,
      },
      {
        path: "/configuracion/usuario/:id/edit",
        element: <Navigate to="/configuracion/usuarios" replace />,
      },
      {
        path: "/configuracion/terceros",
        element: <Thirds />,
      },
      {
        path: "/configuracion/productos",
        element: <Products />,
      },
      {
        path: "/configuracion/troqueles",
        element: <Troqueles />,
      },
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
        path: "/configuracion/productos_clientes",
        element: <ProductCustomers />,
      },
      {
        path: "/configuracion/procesos",
        element: <Processes />,
      },
    ],
  },
  // Rutas para operación de órdenes
  {
    path: "/",
    element: <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "EMPLOYEE"]} />,
    children: [
      { path: "ordenes", element: <Orders /> },
      { path: "ordenes/auditoria", element: <OrdersAudit /> },
      { path: "ordenes/crear", element: <OrderForm /> },
      { path: "ordenes/:id", element: <OrderDetail /> },
      { path: "ordenes/:id/editar", element: <OrderForm /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute
        roles={["ADMIN", "SUPERVISOR", "EMPLOYEE"]}
        withoutShell
      />
    ),
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
