import { Resource, type ResourceRepository, Schedule } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';
import { isForeignKeyViolation, isNotFound } from '../../db/errors';

export class PostgressResourceRepository implements ResourceRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(resource: Resource): PromiseResult<void, StorageError | NotFoundError> {
    try {
      await this.db.resource.create({
        data: {
          id: resource.id,
          code: resource.code,
          name: resource.name,
          establishmentId: resource.establishmentId,
        },
      });
      return ok(undefined);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return fail(new NotFoundError('Establishment', resource.establishmentId));
      }
      return fail(new StorageError('Failed to save resource.'));
    }
  }

  async get(establishmentCode: string): PromiseResult<Resource[], StorageError> {
    try {
      const result = await this.db.establishment.findFirst({
        where: { code: establishmentCode },
        include: {
          resources: {
            include: { schedules: true },
          },
        },
      });

      if (!result) return ok([]);

      return ok(
        result.resources.map((res) =>
          Resource.reconstruct({
            id: res.id,
            code: res.code,
            name: res.name,
            establishmentId: res.establishmentId,
            establishmentCode,
            schedules: res.schedules.map((sch) =>
              Schedule.reconstruct({
                id: sch.id,
                code: sch.code,
                resourceId: sch.resourceId,
                dayOfWeek: sch.dayOfWeek,
                startTime: sch.startTime,
                endTime: sch.endTime,
              })
            ),
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to list resources.'));
    }
  }

  async getByIds(
    ids: string[],
    establishmentCode: string
  ): PromiseResult<Resource[], StorageError> {
    try {
      if (ids.length === 0) return ok([]);

      const resources = await this.db.resource.findMany({
        where: {
          id: { in: ids },
          establishment: { code: establishmentCode },
        },
        include: { schedules: true },
      });

      return ok(
        resources.map((res) =>
          Resource.reconstruct({
            id: res.id,
            code: res.code,
            name: res.name,
            establishmentId: res.establishmentId,
            establishmentCode,
            schedules: res.schedules.map((sch) =>
              Schedule.reconstruct({
                id: sch.id,
                code: sch.code,
                resourceId: sch.resourceId,
                dayOfWeek: sch.dayOfWeek,
                startTime: sch.startTime,
                endTime: sch.endTime,
              })
            ),
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to find resources.'));
    }
  }

  async findByCode(code: string): PromiseResult<Resource | null, StorageError> {
    try {
      const resource = await this.db.resource.findFirst({
        where: { code },
        include: { schedules: true, establishment: { select: { code: true } } },
      });

      if (!resource) return ok(null);

      return ok(
        Resource.reconstruct({
          id: resource.id,
          code: resource.code,
          name: resource.name,
          establishmentId: resource.establishmentId,
          establishmentCode: resource.establishment.code,
          schedules: resource.schedules.map((sch) =>
            Schedule.reconstruct({
              id: sch.id,
              code: sch.code,
              resourceId: sch.resourceId,
              dayOfWeek: sch.dayOfWeek,
              startTime: sch.startTime,
              endTime: sch.endTime,
            })
          ),
        })
      );
    } catch {
      return fail(new StorageError('Failed to find resource.'));
    }
  }

  async update(
    code: string,
    resource: Resource
  ): PromiseResult<Resource, StorageError | NotFoundError> {
    try {
      const row = await this.db.resource.update({
        where: { code },
        data: { name: resource.name },
      });
      return ok(
        Resource.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          establishmentId: row.establishmentId,
          establishmentCode: resource.establishmentCode,
        })
      );
    } catch (error) {
      if (isNotFound(error)) {
        return fail(new NotFoundError('Resource', code));
      }
      return fail(new StorageError('Failed to update resource.'));
    }
  }

  async delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      await this.db.resource.delete({
        where: { code },
      });
      return ok(undefined);
    } catch (error) {
      if (isNotFound(error)) {
        return fail(new NotFoundError('Resource', code));
      }
      if (isForeignKeyViolation(error)) {
        return fail(new ConflictError('Resource has future bookings.'));
      }
      return fail(new StorageError('Failed to delete resource.'));
    }
  }
}
