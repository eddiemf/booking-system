import { Booking, type BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { BookingLoader } from './booking-loader';

describe('BookingLoader', () => {
  const bookingRepository = mock<BookingRepository>();
  const loader = new BookingLoader(bookingRepository);

  const mockBooking = Booking.reconstruct({
    id: 'uuid-bkg',
    code: 'bkg123',
    customerId: 'uuid-user',
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
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: new Date(Date.now() + 90000000).toISOString(),
    status: 'confirmed',
    servicePrice: 0,
    serviceDuration: 30,
  });

  it('returns booking when owned by user', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(mockBooking));

    const data = await loader.loadOwnedByUser('bkg123', 'uuid-user').then((r) => r.getData());

    expect(data).toBe(mockBooking);
  });

  it('returns not-found error when booking does not exist', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(null));

    const error = await loader.loadOwnedByUser('bkg123', 'uuid-user').then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns forbidden error when user is not the owner', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(mockBooking));

    const error = await loader.loadOwnedByUser('bkg123', 'other-user').then((r) => r.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('forwards storage error', async () => {
    bookingRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await loader.loadOwnedByUser('bkg123', 'uuid-user').then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});
