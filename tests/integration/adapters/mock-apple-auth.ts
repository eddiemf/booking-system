import { AuthenticationError } from '@app/domain/errors';
import type { AppleAuthPort, AppleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';

const DEFAULT_VALID_TOKEN = 'valid-apple-token';
const DEFAULT_MOCK_USER: AppleUser = { email: 'bob@apple.com', name: 'Bob' };

export class MockAppleAuth implements AppleAuthPort {
  private validToken: string;
  private mockUser: AppleUser;
  private nextResult: PromiseResult<AppleUser, AuthenticationError> | null = null;

  constructor() {
    this.validToken = DEFAULT_VALID_TOKEN;
    this.mockUser = { ...DEFAULT_MOCK_USER };
  }

  setValidToken(token: string): void {
    this.validToken = token;
  }

  setMockUser(user: AppleUser): void {
    this.mockUser = user;
  }

  /**
   * Override the next verifyToken call with a custom result.
   * Cleared after one use.
   */
  setNextResult(result: PromiseResult<AppleUser, AuthenticationError>): void {
    this.nextResult = result;
  }

  resetToDefaults(): void {
    this.validToken = DEFAULT_VALID_TOKEN;
    this.mockUser = { ...DEFAULT_MOCK_USER };
    this.nextResult = null;
  }

  async verifyToken(token: string): PromiseResult<AppleUser, AuthenticationError> {
    if (this.nextResult) {
      const result = this.nextResult;
      this.nextResult = null;
      return result;
    }

    if (token === this.validToken) {
      return ok({ ...this.mockUser });
    }
    return fail(new AuthenticationError('Invalid or expired Apple token.'));
  }
}
