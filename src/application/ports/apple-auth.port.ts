import type { AuthenticationError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';

export interface AppleUser {
  email: string;
  name: string;
}

export interface AppleAuthPort {
  verifyToken(token: string): PromiseResult<AppleUser, AuthenticationError>;
}
