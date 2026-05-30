import type { Establishment, EstablishmentRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryEstablishmentRepository implements EstablishmentRepository {
  private establishments = new Map<string, Establishment>();

  clear() {
    this.establishments.clear();
  }

  async get(limit: number, offset: number): PromiseResult<Establishment[], StorageError> {
    const result = [...this.establishments.values()].slice(offset, offset + limit);
    return ok(result);
  }

  async findByCode(code: string): PromiseResult<Establishment | null, StorageError> {
    const establishment = [...this.establishments.values()].find((e) => e.code === code);
    return ok(establishment ?? null);
  }

  async save(establishment: Establishment): PromiseResult<void, StorageError> {
    this.establishments.set(establishment.id, establishment);
    return ok(undefined);
  }

  async update(
    code: string,
    establishment: Establishment
  ): PromiseResult<Establishment, StorageError> {
    const existing = [...this.establishments.values()].find((e) => e.code === code);
    if (existing) {
      this.establishments.delete(existing.id);
    }
    this.establishments.set(establishment.id, establishment);
    return ok(establishment);
  }

  async delete(code: string): PromiseResult<void, StorageError> {
    const entry = [...this.establishments.values()].find((e) => e.code === code);
    if (entry) {
      this.establishments.delete(entry.id);
    }
    return ok(undefined);
  }
}
