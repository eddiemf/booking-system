import { Resource, type ResourceRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { InMemoryScheduleRepository } from './in-memory-schedule-repository';

export class InMemoryResourceRepository implements ResourceRepository {
  private resources = new Map<string, Resource>();
  private _scheduleRepo: InMemoryScheduleRepository | null = null;

  setScheduleRepo(repo: InMemoryScheduleRepository) {
    this._scheduleRepo = repo;
  }

  clear() {
    this.resources.clear();
  }

  async save(resource: Resource): PromiseResult<void, StorageError> {
    this.resources.set(resource.id, resource);
    return ok(undefined);
  }

  async get(establishmentCode: string): PromiseResult<Resource[], StorageError> {
    const result = [...this.resources.values()].filter(
      (r) => r.establishmentCode === establishmentCode
    );
    return ok(result.map((r) => this.hydrateSchedules(r)));
  }

  async getByIds(
    ids: string[],
    establishmentCode: string
  ): PromiseResult<Resource[], StorageError> {
    const result = [...this.resources.values()].filter(
      (r) => r.establishmentCode === establishmentCode && ids.includes(r.id)
    );
    return ok(result.map((r) => this.hydrateSchedules(r)));
  }

  async findByCode(code: string): PromiseResult<Resource | null, StorageError> {
    const resource = [...this.resources.values()].find((r) => r.code === code);
    if (!resource) return ok(null);
    return ok(this.hydrateSchedules(resource));
  }

  async update(code: string, resource: Resource): PromiseResult<Resource, StorageError> {
    this.resources.set(resource.id, resource);
    return ok(resource);
  }

  async delete(code: string): PromiseResult<void, StorageError> {
    const entry = [...this.resources.values()].find((r) => r.code === code);
    if (entry) {
      this.resources.delete(entry.id);
    }
    return ok(undefined);
  }

  private hydrateSchedules(resource: Resource): Resource {
    if (!this._scheduleRepo) return resource;

    const schedules = this._scheduleRepo.getByResourceId(resource.id);
    return Resource.reconstruct({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      establishmentId: resource.establishmentId,
      establishmentCode: resource.establishmentCode,
      schedules,
    });
  }
}
