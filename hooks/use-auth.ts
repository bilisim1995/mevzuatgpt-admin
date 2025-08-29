"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser, logout } from '@/lib/auth';
import { User } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const userData = getStoredUser();

    if (token && userData && userData.role === 'admin') {
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      // Eğer admin değilse veya token yoksa temizle
      if (userData && userData.role !== 'admin') {
        logout();
      }
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: handleLogout
  };
}