import { ServiceEntity, ServiceRepository } from '@domain/entities';
import { StorageError } from '@domain/errors';
import { TYPES } from '@shared/ioc-types';
import { Ok, PromiseResult } from '@shared/result';
import { inject, injectable } from 'inversify';
import { servicesTable } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

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
