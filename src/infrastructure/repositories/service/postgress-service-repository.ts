import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { servicesTable } from '../../db/schema';

export class PostgressServiceRepository implements ServiceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError | NotFoundError> {
    try {
      await this.db.insert(servicesTable).values({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        establishmentId: service.establishmentId,
      });
      return ok(service);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new NotFoundError('Establishment', service.establishmentId));
      }
      return fail(new StorageError('Failed to save service.'));
    }
  }

  async findAll(establishmentId: string): PromiseResult<ServiceEntity[], StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(servicesTable)
        .where(eq(servicesTable.establishmentId, establishmentId));
      return ok(
        rows.map((row) =>
          ServiceEntity.reconstruct({
            id: row.id,
            name: row.name,
            description: row.description ?? '',
            duration: row.duration,
            establishmentId: row.establishmentId,
          })
        )
      );
    } catch (error) {
      return fail(new StorageError('Failed to list services.'));
    }
  }

  async findById(
    id: string,
    establishmentId: string
  ): PromiseResult<ServiceEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(servicesTable)
        .where(and(eq(servicesTable.id, id), eq(servicesTable.establishmentId, establishmentId)));
      if (!rows[0]) return ok(null);
      const row = rows[0];
      return ok(
        ServiceEntity.reconstruct({
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          duration: row.duration,
          establishmentId: row.establishmentId,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find service.'));
    }
  }

  async update(
    id: string,
    establishmentId: string,
    service: ServiceEntity
  ): PromiseResult<ServiceEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(servicesTable)
        .set({ name: service.name, description: service.description, duration: service.duration })
        .where(and(eq(servicesTable.id, id), eq(servicesTable.establishmentId, establishmentId)))
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Service', id));
      return ok(
        ServiceEntity.reconstruct({
          id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          establishmentId,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update service.'));
    }
  }

  async delete(
    id: string,
    establishmentId: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const rows = await this.db
        .delete(servicesTable)
        .where(and(eq(servicesTable.id, id), eq(servicesTable.establishmentId, establishmentId)))
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Service', id));
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new ConflictError('Service has future bookings.'));
      }
      return fail(new StorageError('Failed to delete service.'));
    }
  }
}
