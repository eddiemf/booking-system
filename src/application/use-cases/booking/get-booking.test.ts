import { Booking } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { BookingLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { GetBooking } from './get-booking';

describe('GetBooking', () => {
  const bookingLoader = mock<BookingLoader>();
  const useCase = new GetBooking(bookingLoader);

  const userId = 'uuid-user';
  const code = 'bkg123';
  const futureStartsAt = new Date(Date.now() + 86400000).toISOString();
  const futureEndsAt = new Date(Date.now() + 90000000).toISOString();

  const mockBooking = Booking.reconstruct({
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
    status: 'confirmed',
    servicePrice: 0,
    serviceDuration: 60,
  });

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

  it('returns storage error when repository fails', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns booking DTO on success', async () => {
    bookingLoader.loadOwnedByUser.mockResolvedValue(ok(mockBooking));

    const data = await useCase.execute({ code, userId }).then((r) => r.getData());

    expect(data).toBeDefined();
    expect(data.id).toBe(code);
    expect(data.status).toBe('confirmed');
  });
});
