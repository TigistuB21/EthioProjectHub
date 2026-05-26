import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ethioprojecthub-super-secret-key-12345';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentId: string | null;
}

/**
 * Signs a user session payload into a JWT token
 */
export async function signJWT(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedSecret);
}

/**
 * Verifies a JWT token and returns the decoded session, or null if invalid
 */
export async function verifyJWT(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as string,
      departmentId: (payload.departmentId as string | null) || null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Helper to fetch the current user session from server-side request cookies
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (error) {
    return null;
  }
}
