import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedPrefixes = ['/admin', '/teacher'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;

  // Root path: redirect based on auth status
  if (pathname === '/') {
    if (token && userCookie) {
      const dashboardUrl = getDashboardUrl(userCookie, request.url);
      if (dashboardUrl) {
        return NextResponse.redirect(dashboardUrl);
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Auth routes (login): redirect to dashboard if already authenticated
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token && userCookie) {
      const dashboardUrl = getDashboardUrl(userCookie, request.url);
      if (dashboardUrl) {
        return NextResponse.redirect(dashboardUrl);
      }
    }
    return NextResponse.next();
  }

  // Protected routes: redirect to login if not authenticated
  if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access enforcement: admin routes for admin, teacher routes for teacher
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie));
        const role = user.role?.toLowerCase();
        
        if (pathname.startsWith('/admin') && role !== 'admin') {
          // Non-admin trying to access admin routes → redirect to their dashboard
          const redirectUrl = role === 'teacher' ? '/teacher/dashboard' : '/login';
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
        
        if (pathname.startsWith('/teacher') && role !== 'teacher') {
          // Non-teacher trying to access teacher routes → redirect to their dashboard
          const redirectUrl = role === 'admin' ? '/admin/dashboard' : '/login';
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      } catch {
        // Invalid cookie — redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

function getDashboardUrl(userCookie, baseUrl) {
  try {
    const user = JSON.parse(decodeURIComponent(userCookie));
    const role = user.role?.toLowerCase();
    if (role === 'admin') {
      return new URL('/admin/dashboard', baseUrl);
    } else if (role === 'teacher') {
      return new URL('/teacher/dashboard', baseUrl);
    }
  } catch {
    // Invalid user cookie, let it fall through to login
  }
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     * - api routes
     */
    '/((?!_next|api|favicon\\.ico|.*\\.).*)',
  ],
};
