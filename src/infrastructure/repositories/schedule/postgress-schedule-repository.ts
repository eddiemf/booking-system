import { ScheduleEntity, type ScheduleRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schedulesTable } from '../../db/schema';

export class PostgressScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async replaceAll(
    resourceId: string,
    entries: ScheduleEntity[]
  ): PromiseResult<ScheduleEntity[], StorageError | NotFoundError> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.delete(schedulesTable).where(eq(schedulesTable.resourceId, Number(resourceId)));

        if (entries.length > 0) {
          await tx.insert(schedulesTable).values(
            entries.map((entry) => ({
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              resourceId: Number(resourceId),
            }))
          );
        }
      });

      const rows = await this.db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.resourceId, Number(resourceId)));

      return ok(
        rows.map((row) =>
          ScheduleEntity.reconstruct({
            id: String(row.id),
            resourceId: String(row.resourceId),
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
          })
        )
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new NotFoundError('Resource', resourceId));
      }
      return fail(new StorageError('Failed to replace schedule.'));
    }
  }
}
