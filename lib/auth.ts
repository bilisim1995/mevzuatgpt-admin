import { LoginCredentials, LoginResponse, User } from '@/types/auth';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/api';
import { MESSAGES } from '@/constants/messages';

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: MESSAGES.AUTH.LOGIN_FAILED }));
    throw new Error(error.message || MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const data = await response.json();
  
  // Admin rol kontrolü
  if (data.user && data.user.role !== 'admin') {
    throw new Error(MESSAGES.AUTH.UNAUTHORIZED_ROLE);
  }
  
  // Store tokens in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  }
  
  return data;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export function getStoredToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
  return null;
}

export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }
  return null;
}