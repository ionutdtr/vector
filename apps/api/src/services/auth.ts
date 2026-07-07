import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { jwtSecret } from '../config';

const ISSUER = 'vector';
const TOKEN_TTL = '30d';

/**
 * A precomputed hash to compare against when a login email doesn't exist, so the
 * response takes the same time as a real (wrong-password) attempt — this closes
 * the timing side-channel that would otherwise reveal which emails are registered.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('vector-timing-placeholder', 10);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { issuer: ISSUER });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
