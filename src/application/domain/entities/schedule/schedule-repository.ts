import type { NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ScheduleEntity } from './schedule-entity';

export interface ScheduleRepository {
  replaceAll(
    resourceId: string,
    entries: ScheduleEntity[]
  ): PromiseResult<ScheduleEntity[], StorageError | NotFoundError>;
}
