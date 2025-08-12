import { createLogoutResponse } from '@/lib/auth';

export async function POST() {
  return createLogoutResponse();
}