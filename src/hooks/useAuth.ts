import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => void;
  updateProfile: (displayName: string, avatarColor: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check for existing session on mount — trust localStorage directly,
  // no backend call needed. The token will be validated on the first real API call.
  useEffect(() => {
    const storedUser = api.getStoredUser();
    const token = api.getToken();

    if (storedUser && token) {
      setUser({
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        displayName: storedUser.displayName,
        avatarColor: storedUser.avatarColor,
        isGuest: storedUser.username.startsWith('guest_')
      });
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    const response = await api.login(username, password);
    
    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return false;
    }
    
    if (response.data) {
      const userData = response.data.user;
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatarColor: userData.avatarColor,
        isGuest: false
      });
    }
    
    setIsLoading(false);
    return true;
  }, []);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    const response = await api.register(username, email, password, displayName);
    
    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return false;
    }
    
    if (response.data) {
      const userData = response.data.user;
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatarColor: userData.avatarColor,
        isGuest: false
      });
    }
    
    setIsLoading(false);
    return true;
  }, []);

  const loginAsGuest = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    const response = await api.guestLogin();
    
    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return false;
    }
    
    if (response.data) {
      const userData = response.data.user;
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatarColor: userData.avatarColor,
        isGuest: true
      });
    }
    
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const refreshUser = useCallback(() => {
    const storedUser = api.getStoredUser();
    if (storedUser) {
      setUser({
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        displayName: storedUser.displayName,
        avatarColor: storedUser.avatarColor,
        isGuest: storedUser.username.startsWith('guest_')
      });
    }
  }, []);

  const updateProfile = useCallback(async (displayName: string, avatarColor: string) => {
    const res = await api.updateProfile(displayName, avatarColor);
    if (res.data) {
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName,
          avatarColor
        };
      });
      return true;
    }
    return false;
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    loginAsGuest,
    logout,
    clearError,
    refreshUser,
    updateProfile
  };
}
