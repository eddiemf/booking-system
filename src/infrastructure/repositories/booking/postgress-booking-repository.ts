import { Booking, type BookingRepository } from '@app/domain/entities';
import { type ConflictError, type NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';

export class PostgressBookingRepository implements BookingRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(booking: Booking): PromiseResult<void, StorageError | ConflictError> {
    try {
      await this.db.booking.create({
        data: {
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
          servicePrice: booking.servicePrice,
          serviceDuration: booking.serviceDuration,
        },
      });
      return ok(undefined);
    } catch {
      return fail(new StorageError('Failed to save booking.'));
    }
  }

  async findByCode(code: string): PromiseResult<Booking | null, StorageError> {
    try {
      const row = await this.db.booking.findFirst({
        where: { code },
      });

      if (!row) return ok(null);

      return ok(this.toEntity(row));
    } catch {
      return fail(new StorageError('Failed to find booking.'));
    }
  }

  async findByCustomer(customerId: string): PromiseResult<Booking[], StorageError> {
    try {
      const rows = await this.db.booking.findMany({
        where: { customerId },
        orderBy: { startsAt: 'asc' },
      });

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to find bookings.'));
    }
  }

  async findByEstablishment(establishmentCode: string): PromiseResult<Booking[], StorageError> {
    try {
      const rows = await this.db.booking.findMany({
        where: { establishmentCode },
        orderBy: { startsAt: 'asc' },
      });

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to find bookings.'));
    }
  }

  async findOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<Booking[], StorageError> {
    try {
      const rows = await this.db.booking.findMany({
        where: {
          resourceId,
          status: 'confirmed',
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });

      return ok(rows.map(this.toEntity));
    } catch {
      return fail(new StorageError('Failed to check overlapping bookings.'));
    }
  }

  async update(booking: Booking): PromiseResult<void, StorageError | NotFoundError> {
    try {
      await this.db.booking.update({
        where: { code: booking.code },
        data: { status: booking.status },
      });
      return ok(undefined);
    } catch {
      return fail(new StorageError('Failed to update booking.'));
    }
  }

  private toEntity(row: {
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
    servicePrice: number;
    serviceDuration: number;
  }): Booking {
    return Booking.reconstruct({
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
      servicePrice: row.servicePrice,
      serviceDuration: row.serviceDuration,
    });
  }
}
