import { Service, type ServiceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';
import { isForeignKeyViolation, isNotFound } from '../../db/errors';

export class PostgressServiceRepository implements ServiceRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(service: Service): PromiseResult<void, StorageError | NotFoundError> {
    try {
      await this.db.service.create({
        data: {
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.description,
          duration: service.duration.toMinutes(),
          establishmentId: service.establishmentId,
        },
      });
      return ok(undefined);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return fail(new NotFoundError('Establishment', service.establishmentId));
      }
      return fail(new StorageError('Failed to save service.'));
    }
  }

  async get(establishmentCode: string): PromiseResult<Service[], StorageError> {
    try {
      const result = await this.db.establishment.findFirst({
        where: { code: establishmentCode },
        include: { services: true },
      });

      if (!result) return ok([]);

      return ok(
        result.services.map((row) =>
          Service.reconstruct({
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description ?? '',
            duration: row.duration,
            establishmentId: row.establishmentId,
            establishmentCode,
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to list services.'));
    }
  }

  async findByCode(
    code: string,
    establishmentCode: string
  ): PromiseResult<Service | null, StorageError> {
    try {
      const result = await this.db.establishment.findFirst({
        where: { code: establishmentCode },
        include: {
          services: {
            where: { code },
          },
        },
      });

      if (!result) return ok(null);

      const row = result.services[0];
      if (!row) return ok(null);

      return ok(
        Service.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description ?? '',
          duration: row.duration,
          establishmentId: row.establishmentId,
          establishmentCode,
        })
      );
    } catch {
      return fail(new StorageError('Failed to find service.'));
    }
  }

  async update(
    code: string,
    establishmentCode: string,
    service: Service
  ): PromiseResult<void, StorageError | NotFoundError> {
    try {
      const result = await this.db.establishment.findFirst({
        where: { code: establishmentCode },
        select: { id: true },
      });

      if (!result) return fail(new NotFoundError('Establishment', establishmentCode));

      await this.db.service.updateMany({
        where: { code, establishmentId: result.id },
        data: {
          name: service.name,
          description: service.description,
          duration: service.duration.toMinutes(),
        },
      });

      return ok(undefined);
    } catch {
      return fail(new StorageError('Failed to update service.'));
    }
  }

  async delete(
    code: string,
    establishmentCode: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const establishment = await this.db.establishment.findFirst({
        where: { code: establishmentCode },
        select: { id: true },
      });

      if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

      const result = await this.db.service.deleteMany({
        where: { code, establishmentId: establishment.id },
      });

      if (result.count === 0) return fail(new NotFoundError('Service', code));
      return ok(undefined);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return fail(new ConflictError('Service has future bookings.'));
      }
      return fail(new StorageError('Failed to delete service.'));
    }
  }
}
