import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useState } from "react";

const ProtectedRoute = ({ roles, withoutShell = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si hay roles requeridos y el usuario no los tiene
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }

  if (withoutShell) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Navbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet /> {/* ← aquí se renderizan las vistas hijas */}
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
