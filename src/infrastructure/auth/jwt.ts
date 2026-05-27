import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  userCode: string;
  email: string;
}

export function signToken(payload: JwtPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
