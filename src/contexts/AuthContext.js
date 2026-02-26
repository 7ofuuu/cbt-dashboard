'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AuthContext = createContext();

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  secure: isProduction,
  sameSite: 'Strict',
  expires: 1, // 1 day
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user from cookies on mount
    const loadUser = () => {
      try {
        const token = Cookies.get('token');
        const userStr = Cookies.get('user');

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          // Validate required user data fields
          if (userData && userData.id && userData.role && typeof userData.username === 'string') {
            setUser(userData);
          } else {
            // Invalid user data shape — clear auth
            Cookies.remove('token');
            Cookies.remove('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (token, userData) => {
    // Store only non-sensitive user info in cookie
    const safeUserData = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      full_name: userData.full_name || userData.profile?.full_name,
    };
    Cookies.set('token', token, COOKIE_OPTIONS);
    Cookies.set('user', JSON.stringify(safeUserData), COOKIE_OPTIONS);
    setUser(safeUserData);
  };

  const logout = async () => {
    // Call logout API to create activity log
    try {
      const token = Cookies.get('token');
      if (token) {
        const baseUrl = (process.env.NEXT_PUBLIC_HOST || '').replace(/\/+$/, '');
        await axios.post(
          `${baseUrl}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
      }
    } catch {
      // Proceed with local cleanup even if API call fails
    }
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('username');
    localStorage.removeItem('theme');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
