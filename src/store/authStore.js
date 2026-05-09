import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

if (typeof window !== "undefined") {
  window.localStorage.removeItem("auth-storage");
}

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

      hasRole: (roles) => {
        const { user } = useAuthStore.getState();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
