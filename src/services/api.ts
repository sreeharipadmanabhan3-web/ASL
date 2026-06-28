// API Service for Flask Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
  isGuest?: boolean;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  isAsl: boolean;
  timestamp: string;
}

// Token management
const TOKEN_KEY = 'asl_auth_token';
const USER_KEY = 'asl_user';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }
    
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// ==========================================
// AUTH API
// ==========================================

export async function login(
  username: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  if (response.data) {
    setToken(response.data.token);
    setStoredUser(response.data.user);
  }
  
  return response;
}

export async function register(
  username: string,
  email: string,
  password: string,
  displayName?: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, displayName }),
  });
  
  if (response.data) {
    setToken(response.data.token);
    setStoredUser(response.data.user);
  }
  
  return response;
}

export async function guestLogin(): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>('/api/auth/guest', {
    method: 'POST',
  });
  
  if (response.data) {
    setToken(response.data.token);
    setStoredUser(response.data.user);
  }
  
  return response;
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const response = await apiRequest<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
  
  removeToken();
  
  return response;
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>('/api/auth/me');
}

// ==========================================
// MESSAGES API
// ==========================================

export async function getMessages(): Promise<ApiResponse<{ messages: Message[] }>> {
  return apiRequest<{ messages: Message[] }>('/api/messages');
}

export async function sendMessage(
  content: string,
  isAsl: boolean = false
): Promise<ApiResponse<{ message: string; data: Message }>> {
  return apiRequest<{ message: string; data: Message }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ content, isAsl }),
  });
}

// ==========================================
// USERS API
// ==========================================

export async function getUsers(): Promise<ApiResponse<{ users: User[] }>> {
  return apiRequest<{ users: User[] }>('/api/users');
}

export async function getUser(userId: number): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(`/api/users/${userId}`);
}

export async function updateProfile(displayName: string, avatarColor: string): Promise<ApiResponse<{ user: User }>> {
  const storedUser = getStoredUser();
  if (storedUser) {
    const updatedUser = { ...storedUser, displayName, avatarColor };
    setStoredUser(updatedUser);
    
    try {
      await apiRequest('/api/auth/update', {
        method: 'PUT',
        body: JSON.stringify({ displayName, avatarColor })
      });
    } catch (e) {
      // ignore mock/network error
    }
    
    return { data: { user: updatedUser } };
  }
  return { error: 'No user session found' };
}

// ==========================================
// CHECK AUTH STATUS
// ==========================================

export async function checkAuth(): Promise<User | null> {
  const token = getToken();
  
  if (!token) {
    return null;
  }

  try {
    const response = await getCurrentUser();
    
    if (response.data) {
      setStoredUser(response.data.user);
      return response.data.user;
    }

    // If we got a real error response (not a network failure), token is invalid
    if (response.error && response.error !== 'Network error. Please try again.') {
      removeToken();
      return null;
    }

    // Network error — backend is unreachable, fall back to stored user
    const storedUser = getStoredUser();
    return storedUser;
  } catch {
    // Unexpected error — fall back to stored user
    const storedUser = getStoredUser();
    return storedUser;
  }
}
