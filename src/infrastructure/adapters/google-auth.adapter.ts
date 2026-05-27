import { AuthenticationError } from '@app/domain/errors';
import type { GoogleAuthPort, GoogleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';
import { OAuth2Client } from 'google-auth-library';

export class GoogleAuthAdapter implements GoogleAuthPort {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verifyToken(token: string): PromiseResult<GoogleUser, AuthenticationError> {
    try {
      const loginTicket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.clientId,
      });
      const payload = loginTicket.getPayload();
      if (!payload || !payload.email) {
        return fail(new AuthenticationError('Invalid Google token: missing email'));
      }

      return ok({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0] || 'Unknown',
      });
    } catch {
      return fail(new AuthenticationError('Invalid or expired Google token.'));
    }
  }
}
