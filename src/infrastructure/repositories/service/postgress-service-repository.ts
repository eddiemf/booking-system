import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable, servicesTable } from '../../db/schema';

export class PostgressServiceRepository implements ServiceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError | NotFoundError> {
    try {
      await this.db.insert(servicesTable).values({
        id: service.id,
        code: service.code,
        name: service.name,
        description: service.description,
        duration: service.duration.toMinutes(),
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

  async findAll(establishmentCode: string): PromiseResult<ServiceEntity[], StorageError> {
    try {
      const rows = await this.db
        .select({
          id: servicesTable.id,
          code: servicesTable.code,
          name: servicesTable.name,
          description: servicesTable.description,
          duration: servicesTable.duration,
          establishmentId: servicesTable.establishmentId,
          establishmentCode: establishmentsTable.code,
        })
        .from(servicesTable)
        .innerJoin(establishmentsTable, eq(servicesTable.establishmentId, establishmentsTable.id))
        .where(eq(establishmentsTable.code, establishmentCode));
      return ok(
        rows.map((row) =>
          ServiceEntity.reconstruct({
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description ?? '',
            duration: row.duration,
            establishmentId: row.establishmentId,
            establishmentCode: row.establishmentCode,
          })
        )
      );
    } catch (error) {
      return fail(new StorageError('Failed to list services.'));
    }
  }

  async findByCode(
    code: string,
    establishmentCode: string
  ): PromiseResult<ServiceEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select({
          id: servicesTable.id,
          code: servicesTable.code,
          name: servicesTable.name,
          description: servicesTable.description,
          duration: servicesTable.duration,
          establishmentId: servicesTable.establishmentId,
          establishmentCode: establishmentsTable.code,
        })
        .from(servicesTable)
        .innerJoin(establishmentsTable, eq(servicesTable.establishmentId, establishmentsTable.id))
        .where(and(eq(servicesTable.code, code), eq(establishmentsTable.code, establishmentCode)));
      if (!rows[0]) return ok(null);
      const row = rows[0];
      return ok(
        ServiceEntity.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description ?? '',
          duration: row.duration,
          establishmentId: row.establishmentId,
          establishmentCode: row.establishmentCode,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find service.'));
    }
  }

  async update(
    code: string,
    establishmentCode: string,
    service: ServiceEntity
  ): PromiseResult<ServiceEntity, StorageError | NotFoundError> {
    try {
      const establishmentSubquery = this.db
        .select({ id: establishmentsTable.id })
        .from(establishmentsTable)
        .where(eq(establishmentsTable.code, establishmentCode));

      const rows = await this.db
        .update(servicesTable)
        .set({
          name: service.name,
          description: service.description,
          duration: service.duration.toMinutes(),
        })
        .where(
          and(
            eq(servicesTable.code, code),
            eq(servicesTable.establishmentId, establishmentSubquery)
          )
        )
        .returning({
          id: servicesTable.id,
          code: servicesTable.code,
          establishmentId: servicesTable.establishmentId,
        });
      if (!rows[0]) return fail(new NotFoundError('Service', code));
      return ok(
        ServiceEntity.reconstruct({
          id: rows[0].id,
          code: rows[0].code,
          name: service.name,
          description: service.description,
          duration: service.duration.toMinutes(),
          establishmentId: rows[0].establishmentId,
          establishmentCode: service.establishmentCode,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update service.'));
    }
  }

  async delete(
    code: string,
    establishmentCode: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const establishmentSubquery = this.db
        .select({ id: establishmentsTable.id })
        .from(establishmentsTable)
        .where(eq(establishmentsTable.code, establishmentCode));

      const rows = await this.db
        .delete(servicesTable)
        .where(
          and(
            eq(servicesTable.code, code),
            eq(servicesTable.establishmentId, establishmentSubquery)
          )
        )
        .returning({ id: servicesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Service', code));
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new ConflictError('Service has future bookings.'));
      }
      return fail(new StorageError('Failed to delete service.'));
    }
  }
}
