import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

interface AdminAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: string | null;
  setAuth: (accessToken: string, refreshToken: string, role: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,

      setAuth: (accessToken, refreshToken, role) => {
        localStorage.setItem('admin_access_token', accessToken);
        localStorage.setItem('admin_refresh_token', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true, role });
      },

      logout: () => {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        set({ accessToken: null, refreshToken: null, isAuthenticated: false, role: null });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

export const useHasAdminHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (useAdminAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAdminAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return unsub;
  }, []);

  return hasHydrated;
};
