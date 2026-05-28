import type { Schedule, ScheduleRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isForeignKeyViolation } from '../../db/errors';
import { schedulesTable } from '../../db/schema';

export class PostgressScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async replaceAll(
    resourceId: string,
    entries: Schedule[]
  ): PromiseResult<Schedule[], StorageError | NotFoundError> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.delete(schedulesTable).where(eq(schedulesTable.resourceId, resourceId));

        if (entries.length > 0) {
          await tx.insert(schedulesTable).values(
            entries.map((entry) => ({
              id: entry.id,
              code: entry.code,
              dayOfWeek: entry.dayOfWeek.value,
              startTime: entry.timeRange.start.value,
              endTime: entry.timeRange.end.value,
              resourceId,
            }))
          );
        }
      });

      return ok(entries);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return fail(new NotFoundError('Resource', resourceId));
      }
      return fail(new StorageError('Failed to replace schedule.'));
    }
  }
}
