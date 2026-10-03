import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const buildAuthUser = (user) =>
  user
    ? {
        ...user,
        avatarVersion: Date.now(),
      }
    : null;

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user: buildAuthUser(user), isAuthenticated: true }),

      updateUser: (userUpdates) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...userUpdates,
                avatarVersion: Date.now(),
              }
            : state.user,
        })),

      logout: () => set({ user: null, isAuthenticated: false }),

      // Ruteo grueso por rol.
      hasRole: (roles) => {
        const { user } = useAuthStore.getState();
        if (!user) return false;
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes(user.role);
      },

      // Permisos finos (claims). ADMIN siempre pasa (superusuario).
      hasPermission: (permission) => {
        const { user } = useAuthStore.getState();
        if (!user) return false;
        if (user.isAdmin) return true;
        const perms = user.permissions || [];
        const required = Array.isArray(permission) ? permission : [permission];
        return required.every((p) => perms.includes(p));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // No persistimos el arreglo de permisos en localStorage: se repuebla en
      // memoria desde /auth/profile en cada carga (ProtectedRoute).
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user
          ? { ...state.user, permissions: undefined }
          : null,
      }),
    },
  ),
);
