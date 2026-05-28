import type { BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { BookingDTO } from '../../dtos';
import { BookingMapper } from '../../mappers/booking';

interface Input {
  code: string;
  userId: string;
}

type GetBookingError = StorageError | NotFoundError | ForbiddenError;

export class GetBooking {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute({ code, userId }: Input): PromiseResult<BookingDTO, GetBookingError> {
    const result = await this.bookingRepository.findByCode(code);
    if (!result.isOk) return result;
    if (!result.data) return fail(new NotFoundError('Booking', code));

    if (result.data.customerId !== userId) {
      return fail(new ForbiddenError('You do not own this booking.'));
    }

    return ok(BookingMapper.toDTO(result.data));
  }
}
