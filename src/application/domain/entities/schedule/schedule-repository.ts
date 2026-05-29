import type { NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Schedule } from './schedule-entity';

export interface ScheduleRepository {
  replaceAll(
    resourceId: string,
    entries: Schedule[]
  ): PromiseResult<void, StorageError | NotFoundError>;
}
