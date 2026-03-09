import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      hasRole: (roles) => {
        const { user } = useAuthStore.getState();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: "auth-storage", // ← nombre en localStorage
    },
  ),
);
