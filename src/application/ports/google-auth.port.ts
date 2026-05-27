import type { AuthenticationError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';

export interface GoogleUser {
  email: string;
  name: string;
}

export interface GoogleAuthPort {
  verifyToken(token: string): PromiseResult<GoogleUser, AuthenticationError>;
}
