import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { BookingEntity } from './booking-entity';

export interface BookingRepository {
  save(booking: BookingEntity): PromiseResult<BookingEntity, StorageError | ConflictError>;
  findByCode(code: string): PromiseResult<BookingEntity | null, StorageError>;
  findByCustomer(customerId: string): PromiseResult<BookingEntity[], StorageError>;
  findByEstablishment(establishmentCode: string): PromiseResult<BookingEntity[], StorageError>;
  findOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<BookingEntity[], StorageError>;
  update(booking: BookingEntity): PromiseResult<BookingEntity, StorageError | NotFoundError>;
}
