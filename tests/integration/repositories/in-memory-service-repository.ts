import type { Service, ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryServiceRepository implements ServiceRepository {
  private services = new Map<string, Service>();

  clear() {
    this.services.clear();
  }

  async save(service: Service): PromiseResult<void, StorageError> {
    this.services.set(service.id, service);
    return ok(undefined);
  }

  async get(establishmentCode: string): PromiseResult<Service[], StorageError> {
    const result = [...this.services.values()].filter(
      (s) => s.establishmentCode === establishmentCode
    );
    return ok(result);
  }

  async findByCode(
    code: string,
    establishmentCode: string
  ): PromiseResult<Service | null, StorageError> {
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
    const entry = [...this.services.values()].find(
      (s) => s.code === code && s.establishmentCode === establishmentCode
    );
    if (!entry) return fail(new NotFoundError('Service', code));
    this.services.delete(entry.id);
    return ok(undefined);
  }
}
