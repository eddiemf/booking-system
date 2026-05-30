import type { Establishment, EstablishmentRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryEstablishmentRepository implements EstablishmentRepository {
  private establishments = new Map<string, Establishment>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this.establishments.clear();
    this._lastError = undefined;
  }

  async get(limit: number, offset: number): PromiseResult<Establishment[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    const result = [...this.establishments.values()].slice(offset, offset + limit);
    return ok(result);
  }

  async findByCode(code: string): PromiseResult<Establishment | null, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const establishment = [...this.establishments.values()].find((e) => e.code === code);
    return ok(establishment ?? null);
  }

  async save(establishment: Establishment): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    this.establishments.set(establishment.id, establishment);
    return ok(undefined);
  }

  async update(
    code: string,
    establishment: Establishment
  ): PromiseResult<Establishment, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const existing = [...this.establishments.values()].find((e) => e.code === code);
    if (existing) {
      this.establishments.delete(existing.id);
    }
    this.establishments.set(establishment.id, establishment);
    return ok(establishment);
  }

  async delete(code: string): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const entry = [...this.establishments.values()].find((e) => e.code === code);
    if (entry) {
      this.establishments.delete(entry.id);
    }
    return ok(undefined);
  }
}
