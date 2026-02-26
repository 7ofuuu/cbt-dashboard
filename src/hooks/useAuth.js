'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useAuth(allowedRoles = []) {
  const router = useRouter();
  // Stabilize allowedRoles reference to prevent effect re-running on every render
  const rolesKey = JSON.stringify(allowedRoles);
  const stableRoles = useMemo(() => allowedRoles, [rolesKey]);

  useEffect(() => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');

    // Check if user is logged in
    if (!token) {
      router.push('/login');
      return;
    }

    // Check role if specified
    if (stableRoles.length > 0 && userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRole = user.role?.toLowerCase();
        
        if (!userRole || !stableRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on their role
          if (userRole === 'admin') {
            router.push('/admin/dashboard');
          } else if (userRole === 'teacher') {
            router.push('/teacher/dashboard');
          } else if (userRole === 'student') {
            router.push('/login');
          } else {
            router.push('/login');
          }
        }
      } catch (error) {
        router.push('/login');
      }
    }
  }, [router, stableRoles]);
}
