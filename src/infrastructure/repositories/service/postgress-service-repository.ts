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
      const rows = await this.db
        .insert(servicesTable)
        .values({
          name: service.name,
          description: service.description,
          duration: service.duration,
          establishmentId: Number(service.establishmentId),
        })
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new StorageError('Failed to save service.'));
      return ok(
        ServiceEntity.reconstruct({
          id: String(rows[0].id),
          name: service.name,
          description: service.description,
          duration: service.duration,
          establishmentId: service.establishmentId,
        })
      );
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
        .where(eq(servicesTable.establishmentId, Number(establishmentId)));
      return ok(
        rows.map((row) =>
          ServiceEntity.reconstruct({
            id: String(row.id),
            name: row.name,
            description: row.description ?? '',
            duration: row.duration,
            establishmentId: String(row.establishmentId),
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
        .where(
          and(
            eq(servicesTable.id, Number(id)),
            eq(servicesTable.establishmentId, Number(establishmentId))
          )
        );
      if (!rows[0]) return ok(null);
      const row = rows[0];
      return ok(
        ServiceEntity.reconstruct({
          id: String(row.id),
          name: row.name,
          description: row.description ?? '',
          duration: row.duration,
          establishmentId: String(row.establishmentId),
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
        .where(
          and(
            eq(servicesTable.id, Number(id)),
            eq(servicesTable.establishmentId, Number(establishmentId))
          )
        )
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Service', id));
      return ok(
        ServiceEntity.reconstruct({
          id: String(rows[0].id),
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
        .where(
          and(
            eq(servicesTable.id, Number(id)),
            eq(servicesTable.establishmentId, Number(establishmentId))
          )
        )
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
