import type { User, UserRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this.users.clear();
    this._lastError = undefined;
  }

  async findById(id: string): PromiseResult<User | null, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const user = this.users.get(id);
    return ok(user ?? null);
  }

  async findByEmail(email: string): PromiseResult<User | null, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const user = [...this.users.values()].find((u) => u.email.value === email);
    return ok(user ?? null);
  }

  async save(user: User): PromiseResult<User, StorageError> {
    if (this._lastError) return fail(this._lastError);
    this.users.set(user.id, user);
    return ok(user);
  }
}
