import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si hay roles requeridos y el usuario no los tiene
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> {/* ← aquí se renderizan las vistas hijas */}
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
