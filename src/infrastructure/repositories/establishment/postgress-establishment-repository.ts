import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable } from '../../db/schema';

export class PostgressEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: string): PromiseResult<EstablishmentEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(establishmentsTable)
        .where(eq(establishmentsTable.id, Number(id)));
      if (!rows[0]) return ok(null);
      return ok(EstablishmentEntity.reconstruct({ id: String(rows[0].id), name: rows[0].name }));
    } catch (error) {
      return fail(new StorageError('Failed to find establishment.'));
    }
  }

  async save(establishment: EstablishmentEntity): PromiseResult<EstablishmentEntity, StorageError> {
    try {
      const rows = await this.db
        .insert(establishmentsTable)
        .values({ name: establishment.name })
        .returning({ id: establishmentsTable.id });
      if (!rows[0]) return fail(new StorageError('Failed to save establishment.'));
      return ok(
        EstablishmentEntity.reconstruct({
          id: String(rows[0].id),
          name: establishment.name,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to save establishment.'));
    }
  }

  async update(
    id: string,
    establishment: EstablishmentEntity
  ): PromiseResult<EstablishmentEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(establishmentsTable)
        .set({ name: establishment.name })
        .where(eq(establishmentsTable.id, Number(id)))
        .returning({ id: establishmentsTable.id, name: establishmentsTable.name });
      if (!rows[0]) return fail(new NotFoundError('Establishment', id));
      return ok(EstablishmentEntity.reconstruct({ id: String(rows[0].id), name: rows[0].name }));
    } catch (error) {
      return fail(new StorageError('Failed to update establishment.'));
    }
  }
}
