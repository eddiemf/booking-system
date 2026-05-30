import type { Schedule, ScheduleRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryScheduleRepository implements ScheduleRepository {
  private _schedules = new Map<string, Schedule>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this._schedules.clear();
    this._lastError = undefined;
  }

  getByResourceId(resourceId: string): Schedule[] {
    return [...this._schedules.values()].filter((s) => s.resourceId === resourceId);
  }

  async replaceAll(
    resourceId: string,
    entries: Schedule[]
  ): PromiseResult<Schedule[], StorageError> {
    if (this._lastError) return fail(this._lastError);

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
