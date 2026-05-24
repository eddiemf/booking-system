import type { ServiceEntity, ServiceRepository } from '@domain/entities';
import type { StorageError } from '@domain/errors';
import { TYPES } from '@shared/ioc-types';
import { Ok, type PromiseResult } from '@shared/result';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { inject, injectable } from 'inversify';
import { servicesTable } from '../../db/schema';

@injectable()
export class PostgressServiceRepository implements ServiceRepository {
  constructor(@inject(TYPES.DbClient) private readonly db: NodePgDatabase) {}

  async save(service: ServiceEntity): PromiseResult<void, StorageError> {
    try {
      await this.db.insert(servicesTable).values({
        name: service.getName(),
        description: service.getDescription(),
        duration: service.getDuration(),
      });
    } catch (error) {}

    return Ok(undefined);
  }
}
