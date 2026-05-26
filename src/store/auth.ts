'use client';

import { create } from 'zustand';
import type { UserRole } from '@/lib/permissions';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  servantNo: number | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'gkkd-auth-user';

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true, // Start as true to prevent flash of login page
  login: (user: AuthUser) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch { /* ignore */ }
    set({ user, isAuthenticated: true, isHydrating: false });
  },
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    set({ user: null, isAuthenticated: false, isHydrating: false });
  },
  updateUser: (updates: Partial<AuthUser>) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      if (updatedUser) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } catch { /* ignore */ }
      }
      return { user: updatedUser };
    }),
  hydrate: async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        set({ isHydrating: false });
        return;
      }

      const parsed = JSON.parse(stored) as AuthUser;
      if (!parsed?.id) {
        localStorage.removeItem(STORAGE_KEY);
        set({ isHydrating: false });
        return;
      }

      // Verify session with server
      try {
        const res = await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: parsed.id }),
        });

        if (res.ok) {
          const data = await res.json();
          // Update stored user with fresh data from server
          const freshUser: AuthUser = {
            id: data.id,
            name: data.name,
            username: data.username,
            role: data.role,
            servantNo: data.servantNo,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
          set({ user: freshUser, isAuthenticated: true, isHydrating: false });
        } else {
          // Session invalid — clear storage
          localStorage.removeItem(STORAGE_KEY);
          set({ user: null, isAuthenticated: false, isHydrating: false });
        }
      } catch {
        // Network error — still use cached data if available
        set({ user: parsed, isAuthenticated: true, isHydrating: false });
      }
    } catch {
      set({ isHydrating: false });
    }
  },
}));
