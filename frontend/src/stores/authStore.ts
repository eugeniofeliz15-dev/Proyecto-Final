import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '../types/api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        user: null,
        setSession: (token, user) => set({ token, user }, false, 'auth/setSession'),
        clearSession: () =>
          set({ token: null, user: null }, false, 'auth/clearSession'),
      }),
      { name: 'pos-auth' },
    ),
    { name: 'pos-auth' },
  ),
);
