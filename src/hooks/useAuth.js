'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useAuth(allowedRoles = []) {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');

    // Check if user is logged in
    if (!token) {
      router.push('/login');
      return;
    }

    // Check role if specified
    if (allowedRoles.length > 0 && userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRole = user.role?.toLowerCase();
        
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on their role
          if (userRole === 'admin') {
            router.push('/admin/dashboard');
          } else if (userRole === 'guru') {
            router.push('/guru/dashboard');
          } else if (userRole === 'siswa') {
            router.push('/siswa/dashboard');
          } else {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    }
  }, [router, allowedRoles]);
}
