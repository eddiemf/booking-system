import {
  Establishment,
  type EstablishmentRepository,
  Resource,
  Schedule,
  Service,
} from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isForeignKeyViolation } from '../../db/errors';
import {
  establishmentsTable,
  resourcesTable,
  schedulesTable,
  servicesTable,
} from '../../db/schema';

type EstablishmentRow = {
  id: string;
  code: string;
  name: string;
  userId: string;
  resourceId: string | null;
  resourceCode: string | null;
  resourceName: string | null;
  scheduleId: string | null;
  scheduleCode: string | null;
  scheduleDayOfWeek: number | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleResourceId: string | null;
};

export class PostgressEstablishmentRepository implements EstablishmentRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findByCode(code: string): PromiseResult<Establishment | null, StorageError> {
    try {
      const estRows = await this.db
        .select({
          id: establishmentsTable.id,
          code: establishmentsTable.code,
          name: establishmentsTable.name,
          userId: establishmentsTable.userId,
          resourceId: resourcesTable.id,
          resourceCode: resourcesTable.code,
          resourceName: resourcesTable.name,
          scheduleId: schedulesTable.id,
          scheduleCode: schedulesTable.code,
          scheduleDayOfWeek: schedulesTable.dayOfWeek,
          scheduleStartTime: schedulesTable.startTime,
          scheduleEndTime: schedulesTable.endTime,
          scheduleResourceId: schedulesTable.resourceId,
        })
        .from(establishmentsTable)
        .leftJoin(resourcesTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
        .leftJoin(schedulesTable, eq(schedulesTable.resourceId, resourcesTable.id))
        .where(eq(establishmentsTable.code, code));

      if (estRows.length === 0 || !estRows[0]) return ok(null);

      const { id, name: establishmentName, userId } = estRows[0];

      const serviceRows = await this.db
        .select({
          id: servicesTable.id,
          code: servicesTable.code,
          name: servicesTable.name,
          description: servicesTable.description,
          duration: servicesTable.duration,
          establishmentId: servicesTable.establishmentId,
        })
        .from(servicesTable)
        .where(eq(servicesTable.establishmentId, id));

      const resources = this.buildResources(id, code, estRows);
      const services = serviceRows.map((row) =>
        Service.reconstruct({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description ?? '',
          duration: row.duration,
          establishmentId: row.establishmentId,
          establishmentCode: code,
        })
      );

      return ok(
        Establishment.reconstruct({
          id,
          code,
          name: establishmentName,
          userId,
          resources,
          services,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find establishment.'));
    }
  }

  async save(establishment: Establishment): PromiseResult<Establishment, StorageError> {
    try {
      await this.db.insert(establishmentsTable).values({
        id: establishment.id,
        code: establishment.code,
        name: establishment.name,
        userId: establishment.userId,
      });
      return ok(establishment);
    } catch (error) {
      return fail(new StorageError('Failed to save establishment.'));
    }
  }

  async update(
    code: string,
    establishment: Establishment
  ): PromiseResult<Establishment, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(establishmentsTable)
        .set({ name: establishment.name })
        .where(eq(establishmentsTable.code, code))
        .returning({ id: establishmentsTable.id, code: establishmentsTable.code });
      if (!rows[0]) return fail(new NotFoundError('Establishment', code));
      return ok(
        Establishment.reconstruct({
          id: rows[0].id,
          code: rows[0].code,
          name: establishment.name,
          userId: establishment.userId,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to update establishment.'));
    }
  }

  async delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    try {
      const rows = await this.db
        .delete(establishmentsTable)
        .where(eq(establishmentsTable.code, code))
        .returning({ id: establishmentsTable.id });
      if (!rows[0]) return fail(new NotFoundError('Establishment', code));
      return ok(undefined);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return fail(new ConflictError('Establishment has associated services or bookings.'));
      }
      return fail(new StorageError('Failed to delete establishment.'));
    }
  }

  private buildResources(
    establishmentId: string,
    establishmentCode: string,
    rows: EstablishmentRow[]
  ): Resource[] {
    const map = new Map<string, { meta: EstablishmentRow; scheduleRows: EstablishmentRow[] }>();
    for (const row of rows) {
      if (!row.resourceId) continue;
      if (!map.has(row.resourceId)) {
        map.set(row.resourceId, { meta: row, scheduleRows: [] });
      }
      if (row.scheduleId) {
        map.get(row.resourceId)?.scheduleRows.push(row);
      }
    }
    return Array.from(map.values()).map(({ meta, scheduleRows }) =>
      Resource.reconstruct({
        id: meta.resourceId as string,
        code: meta.resourceCode as string,
        name: meta.resourceName as string,
        establishmentId,
        establishmentCode: establishmentCode,
        schedules: scheduleRows.map((scheduleRow) =>
          Schedule.reconstruct({
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
