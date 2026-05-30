import { AuthenticationError } from '@app/domain/errors';
import type { AppleAuthPort, AppleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';

const VALID_TOKEN = 'valid-apple-token';
const MOCK_USER: AppleUser = { email: 'bob@apple.com', name: 'Bob' };

export class MockAppleAuth implements AppleAuthPort {
  async verifyToken(token: string): PromiseResult<AppleUser, AuthenticationError> {
    if (token === VALID_TOKEN) {
      return ok(MOCK_USER);
    }
    return fail(new AuthenticationError('Invalid or expired Apple token.'));
  }
}
