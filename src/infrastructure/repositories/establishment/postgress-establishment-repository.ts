import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable } from '../../db/schema';

export class PostgressEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findByCode(code: string): PromiseResult<EstablishmentEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(establishmentsTable)
        .where(eq(establishmentsTable.code, code));
      if (!rows[0]) return ok(null);
      return ok(
        EstablishmentEntity.reconstruct({ id: rows[0].id, code: rows[0].code, name: rows[0].name })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find establishment.'));
    }
  }

  async save(establishment: EstablishmentEntity): PromiseResult<EstablishmentEntity, StorageError> {
    try {
      await this.db
        .insert(establishmentsTable)
        .values({ id: establishment.id, code: establishment.code, name: establishment.name });
      return ok(establishment);
    } catch (error) {
      return fail(new StorageError('Failed to save establishment.'));
    }
  }

  async update(
    code: string,
    establishment: EstablishmentEntity
  ): PromiseResult<EstablishmentEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(establishmentsTable)
        .set({ name: establishment.name })
        .where(eq(establishmentsTable.code, code))
        .returning({ id: establishmentsTable.id, code: establishmentsTable.code });
      if (!rows[0]) return fail(new NotFoundError('Establishment', code));
      return ok(
        EstablishmentEntity.reconstruct({
          id: rows[0].id,
          code: rows[0].code,
          name: establishment.name,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update establishment.'));
    }
  }

  async delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const rows = await this.db
        .delete(establishmentsTable)
        .where(eq(establishmentsTable.code, code))
        .returning({ id: establishmentsTable.id });
      if (!rows[0]) return fail(new NotFoundError('Establishment', code));
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new ConflictError('Establishment has associated services or bookings.'));
      }
      return fail(new StorageError('Failed to delete establishment.'));
    }
  }
}
