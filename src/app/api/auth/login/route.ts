import { NextRequest } from 'next/server';
import { authenticate, createAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return Response.json({ error: 'Password is required' }, { status: 400 });
    }
    
    if (authenticate(password)) {
      return createAuthResponse();
    } else {
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}