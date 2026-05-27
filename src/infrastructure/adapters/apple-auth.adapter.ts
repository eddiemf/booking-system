import { AuthenticationError } from '@app/domain/errors';
import type { AppleAuthPort, AppleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';
import appleSignin from 'apple-signin-auth';

export class AppleAuthAdapter implements AppleAuthPort {
  constructor(private readonly clientId: string) {}

  async verifyToken(token: string): PromiseResult<AppleUser, AuthenticationError> {
    try {
      const payload = await appleSignin.verifyIdToken(token, {
        audience: this.clientId,
        ignoreExpiration: false,
      });

      return ok({
        email: payload.email || `${payload.sub}@private.apple.com`,
        name: payload.email ? payload.email.split('@')[0] || 'Unknown' : 'Unknown',
      });
    } catch {
      return fail(new AuthenticationError('Invalid or expired Apple token.'));
    }
  }
}
