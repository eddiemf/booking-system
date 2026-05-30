import { Establishment, type EstablishmentRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';
import { isForeignKeyViolation, isNotFound } from '../../db/errors';

export class PostgressEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async get(limit: number, offset: number): PromiseResult<Establishment[], StorageError> {
    try {
      const rows = await this.db.establishment.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'asc' },
      });

      return ok(
        rows.map((row) =>
          Establishment.reconstruct({
            id: row.id,
            code: row.code,
            name: row.name,
            userId: row.userId,
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to list establishments.'));
    }
  }

  async findByCode(code: string): PromiseResult<Establishment | null, StorageError> {
    try {
      const result = await this.db.establishment.findFirst({
        where: { code },
      });

      if (!result) return ok(null);

      return ok(
        Establishment.reconstruct({
          id: result.id,
          code,
          name: result.name,
          userId: result.userId,
        })
      );
    } catch {
      return fail(new StorageError('Failed to find establishment.'));
    }
  }

  async save(establishment: Establishment): PromiseResult<void, StorageError> {
    try {
      await this.db.establishment.create({
        data: {
          id: establishment.id,
          code: establishment.code,
          name: establishment.name,
          userId: establishment.userId,
        },
      });
      return ok(undefined);
    } catch {
      return fail(new StorageError('Failed to save establishment.'));
    }
  }

  async update(
    code: string,
    establishment: Establishment
  ): PromiseResult<Establishment, StorageError | NotFoundError> {
    try {
      const row = await this.db.establishment.update({
        where: { code },
        data: { name: establishment.name },
      });
      return ok(
        Establishment.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          userId: row.userId,
        })
      );
    } catch (error) {
      if (isNotFound(error)) {
        return fail(new NotFoundError('Establishment', code));
      }
      return fail(new StorageError('Failed to update establishment.'));
    }
  }

  async delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      await this.db.establishment.delete({
        where: { code },
      });
      return ok(undefined);
    } catch (error) {
      if (isNotFound(error)) {
        return fail(new NotFoundError('Establishment', code));
      }
      if (isForeignKeyViolation(error)) {
        return fail(new ConflictError('Establishment has associated services or bookings.'));
      }
      return fail(new StorageError('Failed to delete establishment.'));
    }
  }
}
