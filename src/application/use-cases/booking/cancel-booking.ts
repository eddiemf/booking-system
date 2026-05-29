import type { BookingRepository } from '@app/domain/entities';
import type {
  ForbiddenError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { BookingLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { BookingDTO } from '../../dtos';
import { BookingMapper } from '../../mappers/booking';

interface Input {
  code: string;
  userId: string;
}

type CancelBookingError = StorageError | NotFoundError | ForbiddenError | ValidationError;

export class CancelBooking {
  constructor(
    private readonly bookingLoader: BookingLoader,
    private readonly bookingRepository: BookingRepository
  ) {}

  async execute({ code, userId }: Input): PromiseResult<BookingDTO, CancelBookingError> {
    const result = await this.bookingLoader.loadOwnedByUser(code, userId);
    if (!result.isOk) return result;

    const cancelResult = result.data.cancel();
    if (!cancelResult.isOk) return cancelResult;

    const updateResult = await this.bookingRepository.update(result.data);
    if (!updateResult.isOk) return updateResult;

    return ok(BookingMapper.toDTO(result.data));
  }
}
