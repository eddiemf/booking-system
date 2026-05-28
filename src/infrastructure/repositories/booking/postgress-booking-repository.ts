import { BookingEntity, type BookingRepository } from '@app/domain/entities';
import { type ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { bookingsTable } from '../../db/schema';

type BookingRow = {
  id: string;
  code: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  establishmentId: string;
  establishmentCode: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export class PostgressBookingRepository implements BookingRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(booking: BookingEntity): PromiseResult<BookingEntity, StorageError | ConflictError> {
    try {
      await this.db.insert(bookingsTable).values({
        id: booking.id,
        code: booking.code,
        customerId: booking.customerId,
        customerCode: booking.customerCode,
        customerName: booking.customerName,
        establishmentId: booking.establishmentId,
        establishmentCode: booking.establishmentCode,
        serviceId: booking.serviceId,
        serviceCode: booking.serviceCode,
        serviceName: booking.serviceName,
        resourceId: booking.resourceId,
        resourceCode: booking.resourceCode,
        resourceName: booking.resourceName,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      });
      return ok(booking);
    } catch {
      return fail(new StorageError('Failed to save booking.'));
    }
  }

  async findByCode(code: string): PromiseResult<BookingEntity | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.code, code))
        .limit(1);

      const row = rows[0];
      if (!row) return ok(null);

      return ok(this.toEntity(row));
    } catch {
      return fail(new StorageError('Failed to find booking.'));
    }
  }

  async findByCustomer(customerId: string): PromiseResult<BookingEntity[], StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.customerId, customerId))
        .orderBy(bookingsTable.startsAt);

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to find bookings.'));
    }
  }

  async findByEstablishment(
    establishmentCode: string
  ): PromiseResult<BookingEntity[], StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.establishmentCode, establishmentCode))
        .orderBy(bookingsTable.startsAt);

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to find bookings.'));
    }
  }

  async findOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<BookingEntity[], StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.resourceId, resourceId),
            eq(bookingsTable.status, 'confirmed'),
            lt(bookingsTable.startsAt, endsAt),
            gt(bookingsTable.endsAt, startsAt)
          )
        );

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to check overlapping bookings.'));
    }
  }

  async update(booking: BookingEntity): PromiseResult<BookingEntity, StorageError | NotFoundError> {
    try {
      const rows = await this.db
        .update(bookingsTable)
        .set({ status: booking.status })
        .where(eq(bookingsTable.code, booking.code))
        .returning();

      const row = rows[0];
      if (!row) return fail(new NotFoundError('Booking', booking.code));

      return ok(this.toEntity(row));
    } catch {
      return fail(new StorageError('Failed to update booking.'));
    }
  }

  private toEntity(row: BookingRow): BookingEntity {
    return BookingEntity.reconstruct({
      id: row.id,
      code: row.code,
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      establishmentId: row.establishmentId,
      establishmentCode: row.establishmentCode,
      serviceId: row.serviceId,
      serviceCode: row.serviceCode,
      serviceName: row.serviceName,
      resourceId: row.resourceId,
      resourceCode: row.resourceCode,
      resourceName: row.resourceName,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status as 'confirmed' | 'cancelled',
    });
  }
}
