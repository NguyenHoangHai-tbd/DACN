import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../types';
import { hubManager } from '../../../shared/signalr/hubManager';
import { useRoleStore } from '../../../shared/store/roleStore';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  tenantCode: string | null;

  setTokens: (access: string, refresh: string) => void;
  setAuth: (access: string, refresh: string, user: UserProfile, tenantCode: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      tenantCode: null,
      
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      
      setAuth: (access, refresh, user, tenantCode) => {
        set({ accessToken: access, refreshToken: refresh, user, tenantCode });
        hubManager.startSecurityHub();
      },
      
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        hubManager.stopSecurityHub();
        // Reset currentRole in roleStore to 'member'
        useRoleStore.getState().setRole('member');
      },
      
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        user: state.user,
        tenantCode: state.tenantCode 
      }),
    }
  )
);
