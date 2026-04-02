import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import authService from "../../services/auth.service";
import inactivityService, {
  SESSION_INACTIVITY_TIMEOUT_MS,
} from "../../services/inactivity.service";

const ProtectedRoute = ({ roles, withoutShell = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      inactivityService.stop();
      return undefined;
    }

    inactivityService.start({
      timeoutMs: SESSION_INACTIVITY_TIMEOUT_MS,
      onTimeout: async () => {
        try {
          await authService.logout();
        } catch {
          // Si la sesión ya expiró en backend, igual cerramos en frontend.
        } finally {
          logout();
          toast.warning("Tu sesión se cerró después de 40 minutos de inactividad");
          navigate("/login", { replace: true });
        }
      },
    });

    return () => {
      inactivityService.stop();
    };
  }, [isAuthenticated, logout, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

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
