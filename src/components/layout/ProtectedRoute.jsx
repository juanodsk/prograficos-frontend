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
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ roles, withoutShell = false }) => {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [checkingSession, setCheckingSession] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      if (!isAuthenticated) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await authService.profile();
        const profileUser = response?.data?.user;

        if (!profileUser) {
          throw new Error("Perfil inválido");
        }

        if (isMounted) {
          setUser(profileUser);
          setCheckingSession(false);
        }
      } catch {
        if (isMounted) {
          logout();
          setCheckingSession(false);
          navigate("/login", { replace: true });
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, logout, navigate, setUser]);

  useEffect(() => {
    if (!isAuthenticated || checkingSession) {
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
  }, [checkingSession, isAuthenticated, logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated || checkingSession) {
      return undefined;
    }

    const handlePageHide = (event) => {
      if (event.persisted) return;

      authService.logoutOnPageUnload();
      logout();
      inactivityService.stop();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [checkingSession, isAuthenticated, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-[#13529a]">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
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
