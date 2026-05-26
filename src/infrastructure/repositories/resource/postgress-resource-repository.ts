import { ResourceEntity, type ResourceRepository, ScheduleEntity } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { establishmentsTable, resourcesTable, schedulesTable } from '../../db/schema';

type ResourceRow = {
  id: string;
  code: string;
  name: string;
  establishmentId: string;
  establishmentCode: string;
  scheduleId: string | null;
  scheduleCode: string | null;
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

  async findAll(establishmentCode: string): PromiseResult<ResourceEntity[], StorageError> {
    try {
      const rows = await this.db
        .select({
          id: resourcesTable.id,
          code: resourcesTable.code,
          name: resourcesTable.name,
          establishmentId: resourcesTable.establishmentId,
          establishmentCode: establishmentsTable.code,
          scheduleId: schedulesTable.id,
          scheduleCode: schedulesTable.code,
          scheduleDayOfWeek: schedulesTable.dayOfWeek,
          scheduleStartTime: schedulesTable.startTime,
          scheduleEndTime: schedulesTable.endTime,
          scheduleResourceId: schedulesTable.resourceId,
        })
        .from(resourcesTable)
        .innerJoin(establishmentsTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
        .leftJoin(schedulesTable, eq(schedulesTable.resourceId, resourcesTable.id))
        .where(eq(establishmentsTable.code, establishmentCode));

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
          establishmentId: resourcesTable.establishmentId,
          establishmentCode: establishmentsTable.code,
          scheduleId: schedulesTable.id,
          scheduleCode: schedulesTable.code,
          scheduleDayOfWeek: schedulesTable.dayOfWeek,
          scheduleStartTime: schedulesTable.startTime,
          scheduleEndTime: schedulesTable.endTime,
          scheduleResourceId: schedulesTable.resourceId,
        })
        .from(resourcesTable)
        .innerJoin(establishmentsTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
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
        .set({ name: resource.name })
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
          establishmentId: rows[0].establishmentId,
          establishmentCode: resource.establishmentCode,
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
        establishmentId: meta.establishmentId,
        establishmentCode: meta.establishmentCode,
        schedules: scheduleRows.map((scheduleRow) =>
          ScheduleEntity.reconstruct({
            id: scheduleRow.scheduleId as string,
            code: scheduleRow.scheduleCode as string,
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
