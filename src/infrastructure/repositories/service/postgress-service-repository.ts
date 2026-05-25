import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { servicesTable } from '../../db/schema';

export class PostgressServiceRepository implements ServiceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError> {
    try {
      const rows = await this.db
        .insert(servicesTable)
        .values({
          name: service.name,
          description: service.description,
          duration: service.duration,
        })
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new StorageError('Failed to save service.'));
      return ok(
        ServiceEntity.reconstruct({
          id: String(rows[0].id),
          name: service.name,
          description: service.description,
          duration: service.duration,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to save service.'));
    }
  }
}
