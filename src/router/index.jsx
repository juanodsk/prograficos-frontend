import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Login from "../views/auth/Login";
import Dashboard from "../views/dashboard/Dashboard";
import Users from "../views/users/Users";
import Orders from "../views/orders/Orders";
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
    element: <Navigate to="/login" />,
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
      { path: "/admin/usuarios", element: <Users /> },
      // Redirigen al modal que está en la lista
      {
        path: "/admin/usuario/create",
        element: <Navigate to="/admin/usuarios" replace />,
      },
      {
        path: "/admin/usuario/:id/edit",
        element: <Navigate to="/admin/usuarios" replace />,
      },
      {
        path: "/admin/terceros",
        element: <Thirds />,
      },
      {
        path: "/admin/productos",
        element: <Products />,
      },
      {
        path: "/admin/troqueles",
        element: <Troqueles />,
      },
      {
        path: "/admin/medidas",
        element: <Measures />,
      },
      {
        path: "/admin/formatos",
        element: <Formats />,
      },
      {
        path: "/admin/maquinarias",
        element: <Machinery />,
      },
      {
        path: "/admin/tipos_papel",
        element: <PaperTypes />,
      },
      {
        path: "/admin/productos_clientes",
        element: <ProductCustomers />,
      },
      {
        path: "/admin/procesos",
        element: <Processes />,
      },
    ],
  },
  // Rutas para operación de órdenes
  {
    path: "/",
    element: <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"]} />,
    children: [
      { path: "ordenes", element: <Orders /> },
      { path: "ordenes/crear", element: <OrderForm /> },
      { path: "ordenes/:id", element: <OrderDetail /> },
      { path: "ordenes/:id/editar", element: <OrderForm /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute
        roles={["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"]}
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
