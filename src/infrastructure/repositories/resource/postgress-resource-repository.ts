import {
  ResourceEntity,
  type ResourceRepository,
  type ResourceType,
  ScheduleEntity,
} from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable, resourcesTable, schedulesTable } from '../../db/schema';

type ResourceRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  establishmentId: string;
  scheduleId: string | null;
  scheduleDayOfWeek: number | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleResourceId: string | null;
};

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
          scheduleId: schedulesTable.id,
          scheduleDayOfWeek: schedulesTable.dayOfWeek,
          scheduleStartTime: schedulesTable.startTime,
          scheduleEndTime: schedulesTable.endTime,
          scheduleResourceId: schedulesTable.resourceId,
        })
        .from(resourcesTable)
        .innerJoin(establishmentsTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
        .leftJoin(schedulesTable, eq(schedulesTable.resourceId, resourcesTable.id))
        .where(condition);

      return ok(this.groupResourceRows(rows));
    } catch (error) {
      return fail(new StorageError('Failed to list resources.'));
    }
  }

  async findByCode(code: string): PromiseResult<ResourceEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select({
          id: resourcesTable.id,
          code: resourcesTable.code,
          name: resourcesTable.name,
          type: resourcesTable.type,
          establishmentId: resourcesTable.establishmentId,
          scheduleId: schedulesTable.id,
          scheduleDayOfWeek: schedulesTable.dayOfWeek,
          scheduleStartTime: schedulesTable.startTime,
          scheduleEndTime: schedulesTable.endTime,
          scheduleResourceId: schedulesTable.resourceId,
        })
        .from(resourcesTable)
        .leftJoin(schedulesTable, eq(schedulesTable.resourceId, resourcesTable.id))
        .where(eq(resourcesTable.code, code));

      if (rows.length === 0) return ok(null);
      const resources = this.groupResourceRows(rows);
      return ok(resources[0] ?? null);
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

  private groupResourceRows(rows: ResourceRow[]): ResourceEntity[] {
    const map = new Map<string, { meta: ResourceRow; scheduleRows: ResourceRow[] }>();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, { meta: row, scheduleRows: [] });
      }
      if (row.scheduleId) {
        map.get(row.id)?.scheduleRows.push(row);
      }
    }
    return Array.from(map.values()).map(({ meta, scheduleRows }) =>
      ResourceEntity.reconstruct({
        id: meta.id,
        code: meta.code,
        name: meta.name,
        type: meta.type as ResourceType,
        establishmentId: meta.establishmentId,
        schedules: scheduleRows.map((scheduleRow) =>
          ScheduleEntity.reconstruct({
            id: scheduleRow.scheduleId as string,
            resourceId: scheduleRow.scheduleResourceId as string,
            dayOfWeek: scheduleRow.scheduleDayOfWeek as number,
            startTime: scheduleRow.scheduleStartTime as string,
            endTime: scheduleRow.scheduleEndTime as string,
          })
        ),
      })
    );
  }
}
