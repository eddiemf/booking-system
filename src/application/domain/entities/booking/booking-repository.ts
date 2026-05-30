import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Booking } from './booking-entity';

export interface BookingRepository {
  save(booking: Booking): PromiseResult<void, StorageError | ConflictError>;
  findByCode(code: string): PromiseResult<Booking | null, StorageError>;
  getByCustomer(customerId: string): PromiseResult<Booking[], StorageError>;
  getByEstablishment(establishmentCode: string): PromiseResult<Booking[], StorageError>;
  getByResourcesAndDate(
    resourceIds: string[],
    date: string
  ): PromiseResult<Booking[], StorageError>;
  getOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<Booking[], StorageError>;
  update(booking: Booking): PromiseResult<void, StorageError | NotFoundError>;
}
