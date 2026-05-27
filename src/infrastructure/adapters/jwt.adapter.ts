import type { JwtPayload, JwtPort } from '@app/ports';
import { signToken } from '../auth/jwt';

export class JwtAdapter implements JwtPort {
  constructor(private readonly jwtSecret: string) {}

  sign(payload: JwtPayload): string {
    return signToken(payload, this.jwtSecret);
  }
}
