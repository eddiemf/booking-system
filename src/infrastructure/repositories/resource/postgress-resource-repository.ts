import { ResourceEntity, type ResourceRepository, type ResourceType } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable, resourcesTable } from '../../db/schema';

export class PostgressResourceRepository implements ResourceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError> {
    try {
      await this.db.insert(resourcesTable).values({
        id: resource.id,
        code: resource.code,
        name: resource.name,
        type: resource.type,
        establishmentId: resource.establishmentId,
      });
      return ok(resource);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new NotFoundError('Establishment', resource.establishmentId));
      }
      return fail(new StorageError('Failed to save resource.'));
    }
  }

  async findAll(
    establishmentCode: string,
    type?: ResourceType
  ): PromiseResult<ResourceEntity[], StorageError> {
    try {
      const condition = type
        ? and(eq(establishmentsTable.code, establishmentCode), eq(resourcesTable.type, type))
        : eq(establishmentsTable.code, establishmentCode);

      const rows = await this.db
        .select({
          id: resourcesTable.id,
          code: resourcesTable.code,
          name: resourcesTable.name,
          type: resourcesTable.type,
          establishmentId: resourcesTable.establishmentId,
        })
        .from(resourcesTable)
        .innerJoin(establishmentsTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
        .where(condition);
      return ok(
        rows.map((row) =>
          ResourceEntity.reconstruct({
            id: row.id,
            code: row.code,
            name: row.name,
            type: row.type as ResourceType,
            establishmentId: row.establishmentId,
          })
        )
      );
    } catch (error) {
      return fail(new StorageError('Failed to list resources.'));
    }
  }

  async findByCode(code: string): PromiseResult<ResourceEntity | null, StorageError> {
    try {
      const rows = await this.db.select().from(resourcesTable).where(eq(resourcesTable.code, code));
      if (!rows[0]) return ok(null);
      const row = rows[0];
      return ok(
        ResourceEntity.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          type: row.type as ResourceType,
          establishmentId: row.establishmentId,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find resource.'));
    }
  }

  async update(
    code: string,
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(resourcesTable)
        .set({ name: resource.name, type: resource.type })
        .where(eq(resourcesTable.code, code))
        .returning({
          id: resourcesTable.id,
          code: resourcesTable.code,
          establishmentId: resourcesTable.establishmentId,
        });
      if (!rows[0]) return fail(new NotFoundError('Resource', code));
      return ok(
        ResourceEntity.reconstruct({
          id: rows[0].id,
          code: rows[0].code,
          name: resource.name,
          type: resource.type,
          establishmentId: rows[0].establishmentId,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update resource.'));
    }
  }

  async delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const rows = await this.db
        .delete(resourcesTable)
        .where(eq(resourcesTable.code, code))
        .returning({ id: resourcesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Resource', code));
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new ConflictError('Resource has future bookings.'));
      }
      return fail(new StorageError('Failed to delete resource.'));
    }
  }
}
