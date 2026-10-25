'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { isMockMode, setMockMode } from '@/lib/api-config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  mockMode: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  toggleMockMode: () => void;
}

const defaultAdmin: User = {
  id: 'usr-admin-1',
  name: 'Super Admin (Nafis)',
  phone: '+8801700000000',
  email: 'admin@rentbd.com',
  role: 'admin',
  is_verified: true,
  nid_status: 'verified',
  listings_count: 0,
  joined_at: '2025-01-01T00:00:00Z',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  occupation: 'Head of Operations & Trust',
};

function getInitialAuth(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }
  const storedToken = localStorage.getItem('rentbd_admin_token') || localStorage.getItem('baribara_admin_token');
  const storedUser = localStorage.getItem('rentbd_admin_user') || localStorage.getItem('baribara_admin_user');

  if (storedToken && storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.role === 'admin') {
        return { user: parsed, token: storedToken };
      }
    } catch {
      localStorage.removeItem('rentbd_admin_token');
      localStorage.removeItem('rentbd_admin_user');
      localStorage.removeItem('baribara_admin_token');
      localStorage.removeItem('baribara_admin_user');
    }
  }

  // Strictly require manual login - no auto-login bypass
  return {
    user: null,
    token: null,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(getInitialAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [mockMode, setMockModeState] = useState(() => (typeof window !== 'undefined' ? isMockMode() : true));

  const user = authState.user;
  const token = authState.token;

  useEffect(() => {
    const handleMockChange = () => {
      setMockModeState(isMockMode());
    };

    window.addEventListener('rentbd_mock_mode_changed', handleMockChange);
    window.addEventListener('baribara_mock_mode_changed', handleMockChange);

    return () => {
      window.removeEventListener('rentbd_mock_mode_changed', handleMockChange);
      window.removeEventListener('baribara_mock_mode_changed', handleMockChange);
    };
  }, []);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(identifier, pass);
      if (!res.user || res.user.role !== 'admin') {
        throw new Error('Access Denied: Only users with the "admin" role have permission to access the RentBD Admin Panel.');
      }
      setAuthState({ user: res.user, token: res.access });
      localStorage.setItem('rentbd_admin_token', res.access);
      localStorage.setItem('rentbd_admin_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthState({ user: null, token: null });
    localStorage.removeItem('rentbd_admin_token');
    localStorage.removeItem('rentbd_admin_user');
    localStorage.removeItem('baribara_admin_token');
    localStorage.removeItem('baribara_admin_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const toggleMockMode = () => {
    const nextVal = !mockMode;
    setMockMode(nextVal);
    setMockModeState(nextVal);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        mockMode,
        login,
        logout,
        toggleMockMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
