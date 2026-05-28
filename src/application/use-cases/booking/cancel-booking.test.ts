import { BookingEntity, type BookingRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CancelBooking } from './cancel-booking';

describe('CancelBooking', () => {
  const bookingRepository = mock<BookingRepository>();
  const useCase = new CancelBooking(bookingRepository);

  const userId = 'uuid-user';
  const code = 'bkg123';
  const futureStartsAt = new Date(Date.now() + 86400000).toISOString();
  const futureEndsAt = new Date(Date.now() + 90000000).toISOString();

  const existingBooking = BookingEntity.reconstruct({
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

  const cancelledBooking = BookingEntity.reconstruct({
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
    status: 'cancelled',
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

  it('returns validation error when booking is already cancelled', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(cancelledBooking));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when update fails', async () => {
    bookingRepository.findByCode.mockResolvedValue(ok(existingBooking));
    bookingRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ code, userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns booking DTO with cancelled status on success', async () => {
    const freshBooking = BookingEntity.reconstruct({
      id: 'uuid-bkg-fresh',
      code: 'bkg-fresh',
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
    bookingRepository.findByCode.mockResolvedValue(ok(freshBooking));
    bookingRepository.update.mockImplementation(async (entity) => ok(entity));

    const data = await useCase.execute({ code: 'bkg-fresh', userId }).then((r) => r.getData());

    expect(data.status).toBe('cancelled');
    expect(data.id).toBe('bkg-fresh');
  });
});
