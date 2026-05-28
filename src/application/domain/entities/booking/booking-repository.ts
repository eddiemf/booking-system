import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Booking } from './booking-entity';

export interface BookingRepository {
  save(booking: Booking): PromiseResult<Booking, StorageError | ConflictError>;
  findByCode(code: string): PromiseResult<Booking | null, StorageError>;
  findByCustomer(customerId: string): PromiseResult<Booking[], StorageError>;
  findByEstablishment(establishmentCode: string): PromiseResult<Booking[], StorageError>;
  findOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<Booking[], StorageError>;
  update(booking: Booking): PromiseResult<Booking, StorageError | NotFoundError>;
}
