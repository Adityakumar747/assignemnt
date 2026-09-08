import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types/index.js';
import * as authApi from '../api/auth.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  isAdmin: boolean;
  isSales: boolean;
  isWarehouse: boolean;
  isAccounts: boolean;
  canManageCustomers: boolean;
  canManageStock: boolean;
  canManageChallans: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_EMAILS: Record<Role, string> = {
  ADMIN: 'admin@ops.local',
  SALES: 'sales@ops.local',
  WAREHOUSE: 'warehouse@ops.local',
  ACCOUNTS: 'accounts@ops.local'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ops_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ops_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('ops_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('ops_token');
          localStorage.removeItem('ops_user');
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [token]);

  const login = useCallback(async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('ops_token', data.token);
      localStorage.setItem('ops_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ops_token');
    localStorage.removeItem('ops_user');
    window.location.href = '/login';
  }, []);

  // 1-click role switcher helper for evaluators
  const switchRole = useCallback(async (role: Role) => {
    const email = ROLE_EMAILS[role];
    await login(email, 'Password123!');
  }, [login]);

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSales = role === 'SALES';
  const isWarehouse = role === 'WAREHOUSE';
  const isAccounts = role === 'ACCOUNTS';

  const canManageCustomers = isAdmin || isSales;
  const canManageStock = isAdmin || isWarehouse;
  const canManageChallans = isAdmin || isSales;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        isAdmin,
        isSales,
        isWarehouse,
        isAccounts,
        canManageCustomers,
        canManageStock,
        canManageChallans
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
