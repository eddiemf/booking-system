import type { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { BookingLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { BookingDTO } from '../../dtos';
import { BookingMapper } from '../../mappers/booking';

interface Input {
  code: string;
  userId: string;
}

type GetBookingError = StorageError | NotFoundError | ForbiddenError;

export class GetBooking {
  constructor(private readonly bookingLoader: BookingLoader) {}

  async execute({ code, userId }: Input): PromiseResult<BookingDTO, GetBookingError> {
    const result = await this.bookingLoader.loadOwnedByUser(code, userId);
    if (!result.isOk) return result;

    return ok(BookingMapper.toDTO(result.data));
  }
}
