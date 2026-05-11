import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth.types';
import * as authService from '../services/authService';
import { getRefreshToken } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccessToken = useCallback(async () => {
    const response = await authService.refreshToken();
    authService.storeTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Failed to refresh token on mount:', error);
          authService.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [refreshAccessToken]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    authService.storeTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const response = await authService.register(email, password, firstName, lastName);
    authService.storeTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
