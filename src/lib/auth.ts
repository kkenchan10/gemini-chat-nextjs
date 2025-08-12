import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yusei';
const AUTH_COOKIE_NAME = 'gemini-chat-auth';
const AUTH_TOKEN = 'authenticated';

export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === AUTH_TOKEN;
}

export function authenticate(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAuthResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authCookie = req.cookies.get(AUTH_COOKIE_NAME);
    
    if (authCookie?.value !== AUTH_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(req);
  };
}