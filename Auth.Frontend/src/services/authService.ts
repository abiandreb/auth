import apiClient, {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from './apiService';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> => {
  const request: RegisterRequest = { email, password, firstName, lastName };
  const response = await apiClient.post<AuthResponse>('/api/auth/register', request);
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const request: LoginRequest = { email, password };
  const response = await apiClient.post<AuthResponse>('/api/auth/login', request);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  clearTokens();
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
    refreshToken: refreshTokenValue,
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/user/me');
  return response.data;
};

export const getProtectedData = async () => {
  const response = await apiClient.get('/api/user/data');
  return response.data;
};

export const getPublicData = async () => {
  const response = await apiClient.get('/api/user/public');
  return response.data;
};

export const getAdminData = async () => {
  const response = await apiClient.get('/api/user/admin');
  return response.data;
};

export const storeTokens = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

export { clearTokens };
