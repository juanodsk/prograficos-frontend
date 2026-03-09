import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Login from "../views/auth/Login";
import Dashboard from "../views/dashboard/Dashboard";
import Users from "../views/users/Users";
import Orders from "../views/orders/Orders";
import Products from "../views/products/Products";
import Unauthorized from "../views/Unauthorized";
import UserForm from "../views/users/UserForm";

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
      //RUTAS DE ADMINISTRACIÓN
      { path: "/admin/usuarios", element: <Users /> },
      { path: "admin/usuario/create", element: <UserForm /> },
      { path: "/admin/usuario/:id/edit", element: <UserForm /> },
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
