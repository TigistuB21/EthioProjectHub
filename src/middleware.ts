import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'ethioprojecthub-super-secret-key-12345';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Role-specific routes
const roleRoutes: Record<string, string> = {
  '/dashboard/admin': 'ADMIN',
  '/dashboard/advisor': 'ADVISOR',
  '/dashboard/student': 'STUDENT',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    const role = payload.role as string;

    // Check role-based access
    for (const [routePrefix, requiredRole] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(routePrefix) && role !== requiredRole && role !== 'ADMIN') {
        // Redirect to appropriate dashboard
        const redirectPath =
          role === 'ADVISOR'
            ? '/dashboard/advisor'
            : role === 'ADMIN'
              ? '/dashboard/admin'
              : '/dashboard/student';
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token — clear cookie and redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
