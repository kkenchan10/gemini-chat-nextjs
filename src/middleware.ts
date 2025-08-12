import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('gemini-chat-auth');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Allow access to auth API routes
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated
  if (!authCookie || authCookie.value !== 'authenticated') {
    // Allow access to login page
    if (isLoginPage) {
      return NextResponse.next();
    }
    
    // Redirect other requests to login
    if (!isApiRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Return 401 for API routes
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If user is authenticated and tries to access login page, redirect to home
  if (isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};