import { AuthenticationError } from '@app/domain/errors';
import type { GoogleAuthPort, GoogleUser } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';

const DEFAULT_VALID_TOKEN = 'valid-google-token';
const DEFAULT_MOCK_USER: GoogleUser = { email: 'alice@example.com', name: 'Alice' };

export class MockGoogleAuth implements GoogleAuthPort {
  private validToken: string;
  private mockUser: GoogleUser;
  private nextResult: PromiseResult<GoogleUser, AuthenticationError> | null = null;

  constructor() {
    this.validToken = DEFAULT_VALID_TOKEN;
    this.mockUser = { ...DEFAULT_MOCK_USER };
  }

  setValidToken(token: string): void {
    this.validToken = token;
  }

  setMockUser(user: GoogleUser): void {
    this.mockUser = user;
  }

  /**
   * Override the next verifyToken call with a custom result.
   * Cleared after one use.
   */
  setNextResult(result: PromiseResult<GoogleUser, AuthenticationError>): void {
    this.nextResult = result;
  }

  resetToDefaults(): void {
    this.validToken = DEFAULT_VALID_TOKEN;
    this.mockUser = { ...DEFAULT_MOCK_USER };
    this.nextResult = null;
  }

  async verifyToken(token: string): PromiseResult<GoogleUser, AuthenticationError> {
    if (this.nextResult) {
      const result = this.nextResult;
      this.nextResult = null;
      return result;
    }

    if (token === this.validToken) {
      return ok({ ...this.mockUser });
    }
    return fail(new AuthenticationError('Invalid or expired Google token.'));
  }
}
