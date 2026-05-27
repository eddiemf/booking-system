import type { JwtPayload } from '@infrastructure/auth/jwt';
import { verifyToken } from '@infrastructure/auth/jwt';
import type { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Missing or invalid authorization header.', code: 'AuthenticationError' });
    }

    const token = header.slice(7);
    try {
      const payload = verifyToken(token, jwtSecret);
      req.user = payload;
      next();
    } catch {
      return res
        .status(401)
        .json({ message: 'Invalid or expired token.', code: 'AuthenticationError' });
    }
  };
}
