import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable } from '../../db/schema';

export class PostgressEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly db: NodePgDatabase) {}

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
}
