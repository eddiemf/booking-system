import type { Booking, BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class BookingLoader {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async loadOwnedByUser(
    code: string,
    userId: string
  ): PromiseResult<Booking, StorageError | NotFoundError | ForbiddenError> {
    const result = await this.bookingRepository.findByCode(code);
    if (!result.isOk) return result;

    const booking = result.data;
    if (!booking) return fail(new NotFoundError('Booking', code));

    if (booking.customerId !== userId) {
      return fail(new ForbiddenError('You do not own this booking.'));
    }

    return ok(booking);
  }
}
