import { AuthenticationError } from '@app/domain/errors';
import type { GoogleAuthPort, GoogleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';

const VALID_TOKEN = 'valid-google-token';
const MOCK_USER: GoogleUser = { email: 'alice@example.com', name: 'Alice' };

export class MockGoogleAuth implements GoogleAuthPort {
  async verifyToken(token: string): PromiseResult<GoogleUser, AuthenticationError> {
    if (token === VALID_TOKEN) {
      return ok(MOCK_USER);
    }
    return fail(new AuthenticationError('Invalid or expired Google token.'));
  }
}
