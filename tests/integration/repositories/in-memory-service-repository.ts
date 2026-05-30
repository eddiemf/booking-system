import type { Service, ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryServiceRepository implements ServiceRepository {
  private services = new Map<string, Service>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this.services.clear();
    this._lastError = undefined;
  }

  async save(service: Service): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    this.services.set(service.id, service);
    return ok(undefined);
  }

  async get(establishmentCode: string): PromiseResult<Service[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    const result = [...this.services.values()].filter(
      (s) => s.establishmentCode === establishmentCode
    );
    return ok(result);
  }

  async findByCode(
    code: string,
    establishmentCode: string
  ): PromiseResult<Service | null, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const service = [...this.services.values()].find(
      (s) => s.code === code && s.establishmentCode === establishmentCode
    );
    return ok(service ?? null);
  }

  async update(
    code: string,
    establishmentCode: string,
    service: Service
  ): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const existing = [...this.services.values()].find(
      (s) => s.code === code && s.establishmentCode === establishmentCode
    );
    if (existing) {
      this.services.delete(existing.id);
    }
    this.services.set(service.id, service);
    return ok(undefined);
  }

  async delete(
    code: string,
    establishmentCode: string
  ): PromiseResult<void, StorageError | NotFoundError> {
    if (this._lastError) return fail(this._lastError);
    const entry = [...this.services.values()].find(
      (s) => s.code === code && s.establishmentCode === establishmentCode
    );
    if (!entry) return fail(new NotFoundError('Service', code));
    this.services.delete(entry.id);
    return ok(undefined);
  }
}
