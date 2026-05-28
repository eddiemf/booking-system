import { Booking, type BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { GetBooking } from './get-booking';

describe('GetBooking', () => {
  const bookingRepository = mock<BookingRepository>();
  const useCase = new GetBooking(bookingRepository);

  const userId = 'uuid-user';
  const code = 'bkg123';

  const existingBooking = Booking.reconstruct({
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
    startsAt: '2026-06-15T09:00:00Z',
    endsAt: '2026-06-15T10:00:00Z',
    status: 'confirmed',
    servicePrice: 0,
    serviceDuration: 60,
  });

  it('returns not-found error when booking does not exist', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns forbidden error when user does not own the booking', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(existingBooking));

    const error = await useCase.execute({ code, userId: 'other-user' }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns storage error when repository fails', async () => {
    bookingRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns booking DTO on success', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(existingBooking));

    const data = await useCase.execute({ code, userId }).then((r) => r.getData());

    expect(data).toBeDefined();
    expect(data.id).toBe(code);
    expect(data.customerCode).toBe('usr123');
  });
});
