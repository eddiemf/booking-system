import type { Schedule, ScheduleRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryScheduleRepository implements ScheduleRepository {
  private _schedules = new Map<string, Schedule>();

  clear() {
    this._schedules.clear();
  }

  getByResourceId(resourceId: string): Schedule[] {
    return [...this._schedules.values()].filter((s) => s.resourceId === resourceId);
  }

  async replaceAll(
    resourceId: string,
    entries: Schedule[]
  ): PromiseResult<Schedule[], StorageError> {
    for (const [id, schedule] of this._schedules.entries()) {
      if (schedule.resourceId === resourceId) {
        this._schedules.delete(id);
      }
    }

    for (const entry of entries) {
      this._schedules.set(entry.id, entry);
    }

    return ok(entries);
  }
}
