import type { Schedule, ScheduleRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';
import { isForeignKeyViolation } from '../../db/errors';

export class PostgressScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: PrismaClient) {}

  async replaceAll(
    resourceId: string,
    entries: Schedule[]
  ): PromiseResult<Schedule[], StorageError | NotFoundError> {
    try {
      await this.db.$transaction(async (tx) => {
        await tx.schedule.deleteMany({
          where: { resourceId },
        });

        if (entries.length > 0) {
          await tx.schedule.createMany({
            data: entries.map((entry) => ({
              id: entry.id,
              code: entry.code,
              dayOfWeek: entry.dayOfWeek.value,
              startTime: entry.timeRange.start.value,
              endTime: entry.timeRange.end.value,
              resourceId,
            })),
          });
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
