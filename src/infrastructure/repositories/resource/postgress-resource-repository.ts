import { ResourceEntity, type ResourceRepository, type ResourceType } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { resourcesTable } from '../../db/schema';

export class PostgressResourceRepository implements ResourceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .insert(resourcesTable)
        .values({
          name: resource.name,
          type: resource.type,
          establishmentId: Number(resource.establishmentId),
        })
        .returning({ id: resourcesTable.id });
      if (!rows[0]) return fail(new StorageError('Failed to save resource.'));
      return ok(
        ResourceEntity.reconstruct({
          id: String(rows[0].id),
          name: resource.name,
          type: resource.type,
          establishmentId: resource.establishmentId,
        })
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new NotFoundError('Establishment', resource.establishmentId));
      }
      return fail(new StorageError('Failed to save resource.'));
    }
  }

  async findAll(
    establishmentId: string,
    type?: ResourceType
  ): PromiseResult<ResourceEntity[], StorageError> {
    try {
      const condition = type
        ? and(
            eq(resourcesTable.establishmentId, Number(establishmentId)),
            eq(resourcesTable.type, type)
          )
        : eq(resourcesTable.establishmentId, Number(establishmentId));

      const rows = await this.db.select().from(resourcesTable).where(condition);
      return ok(
        rows.map((row) =>
          ResourceEntity.reconstruct({
            id: String(row.id),
            name: row.name,
            type: row.type as ResourceType,
            establishmentId: String(row.establishmentId),
          })
        )
      );
    } catch (error) {
      return fail(new StorageError('Failed to list resources.'));
    }
  }

  async findById(id: string): PromiseResult<ResourceEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(resourcesTable)
        .where(eq(resourcesTable.id, Number(id)));
      if (!rows[0]) return ok(null);
      const row = rows[0];
      return ok(
        ResourceEntity.reconstruct({
          id: String(row.id),
          name: row.name,
          type: row.type as ResourceType,
          establishmentId: String(row.establishmentId),
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find resource.'));
    }
  }

  async update(
    id: string,
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(resourcesTable)
        .set({ name: resource.name, type: resource.type })
        .where(eq(resourcesTable.id, Number(id)))
        .returning({ id: resourcesTable.id, establishmentId: resourcesTable.establishmentId });
      if (!rows[0]) return fail(new NotFoundError('Resource', id));
      return ok(
        ResourceEntity.reconstruct({
          id: String(rows[0].id),
          name: resource.name,
          type: resource.type,
          establishmentId: String(rows[0].establishmentId),
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update resource.'));
    }
  }

  async delete(id: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const rows = await this.db
        .delete(resourcesTable)
        .where(eq(resourcesTable.id, Number(id)))
        .returning({ id: resourcesTable.id });
      if (!rows[0]) return fail(new NotFoundError('Resource', id));
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        return fail(new ConflictError('Resource has future bookings.'));
      }
      return fail(new StorageError('Failed to delete resource.'));
    }
  }
}
