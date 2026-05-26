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
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user: AuthUser) => {
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (updates: Partial<AuthUser>) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      return { user: updatedUser };
    }),
}));
