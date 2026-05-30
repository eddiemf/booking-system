import type { BookingRepository, EstablishmentRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { BookingDTO } from '../../../dtos';
import { BookingMapper } from '../../../mappers/booking';

interface Input {
  establishmentCode?: string | undefined;
  userId: string;
}

export class ListBookings {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({ establishmentCode, userId }: Input): PromiseResult<BookingDTO[], StorageError> {
    // If establishmentCode provided, verify ownership and scope to establishment
    if (establishmentCode) {
      const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
      if (!establishmentResult.isOk) return establishmentResult;
      if (!establishmentResult.data) return ok([]);

      // If user owns the establishment, return establishment bookings
      if (establishmentResult.data.userId === userId) {
        const result = await this.bookingRepository.getByEstablishment(establishmentCode);
        if (!result.isOk) return result;
        return ok(result.data.map(BookingMapper.toDTO));
      }
    }

    // Otherwise return customer's own bookings
    const result = await this.bookingRepository.getByCustomer(userId);
    if (!result.isOk) return result;

    return ok(result.data.map(BookingMapper.toDTO));
  }
}
