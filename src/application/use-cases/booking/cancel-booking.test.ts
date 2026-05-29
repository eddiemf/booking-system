import { Booking, type BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { BookingLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CancelBooking } from './cancel-booking';

describe('CancelBooking', () => {
  const bookingLoader = mock<BookingLoader>();
  const bookingRepository = mock<BookingRepository>();
  const useCase = new CancelBooking(bookingLoader, bookingRepository);

  const userId = 'uuid-user';
  const code = 'bkg123';
  const futureStartsAt = new Date(Date.now() + 86400000).toISOString();
  const futureEndsAt = new Date(Date.now() + 90000000).toISOString();

  function makeBooking(status: 'confirmed' | 'cancelled' = 'confirmed'): Booking {
    return Booking.reconstruct({
      id: 'uuid-bkg',
      code,
      customerId: userId,
      customerCode: 'usr123',
      customerName: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode: 'est123',
      serviceId: 'uuid-svc',
      serviceCode: 'svc123',
      serviceName: 'Haircut',
      resourceId: 'uuid-res',
      resourceCode: 'res123',
      resourceName: 'Bob',
      startsAt: futureStartsAt,
      endsAt: futureEndsAt,
      status,
      servicePrice: 0,
      serviceDuration: 60,
    });
  }

  it('returns not-found error when booking does not exist', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(fail(new NotFoundError('Booking', code)));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns forbidden error when user does not own the booking', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this booking.'))
    );

    const error = await useCase.execute({ code, userId: 'other-user' }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns validation error when booking is already cancelled', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(ok(makeBooking('cancelled')));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when update fails', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(ok(makeBooking()));
    bookingRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns booking DTO with cancelled status on success', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(ok(makeBooking()));
    bookingRepository.update.mockResolvedValue(ok(undefined));

    const data = await useCase.execute({ code, userId }).then((r) => r.getData());

    expect(data.status).toBe('cancelled');
    expect(data.id).toBe(code);
  });
});
