import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Login from "../views/auth/Login";
import Dashboard from "../views/dashboard/Dashboard";
import Users from "../views/users/Users";
import Orders from "../views/orders/Orders";
import Thirds from "../views/thirds/Thirds";
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
    ],
  },
  // Rutas para ADMIN, SUPERVISOR y EMPLOYEE
  {
    path: "/",
    element: <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "EMPLOYEE"]} />,
    children: [{ path: "ordenes", element: <Orders /> }],
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
