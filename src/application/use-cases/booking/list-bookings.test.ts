import {
  Booking,
  type BookingRepository,
  Establishment,
  type EstablishmentRepository,
} from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListBookings } from './list-bookings';

describe('ListBookings', () => {
  const bookingRepository = mock<BookingRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new ListBookings(bookingRepository, establishmentRepository);

  const userId = 'uuid-user';
  const establishmentCode = 'est123';

  const mockBooking = Booking.reconstruct({
    id: 'uuid-bkg',
    code: 'bkg1',
    customerId: userId,
    customerCode: 'usr123',
    customerName: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode,
    serviceId: 'uuid-svc',
    serviceCode: 'svc1',
    serviceName: 'Haircut',
    resourceId: 'uuid-res',
    resourceCode: 'res1',
    resourceName: 'Bob',
    startsAt: '2026-06-15T09:00:00Z',
    endsAt: '2026-06-15T10:00:00Z',
    status: 'confirmed',
    servicePrice: 0,
    serviceDuration: 60,
  });

  it('returns customer bookings when no establishment code given', async () => {
    bookingRepository.findByCustomer.mockResolvedValue(ok([mockBooking]));

    const data = await useCase.execute({ userId }).then((r) => r.getData());

    expect(data).toHaveLength(1);
    expect(data[0]?.id).toBe('bkg1');
  });

  it('returns establishment bookings when user owns the establishment', async () => {
    const mockEst = Establishment.reconstruct({
      id: 'uuid-est',
      code: establishmentCode,
      name: 'Salon',
      userId,
    });
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEst));
    bookingRepository.findByEstablishment.mockResolvedValue(ok([mockBooking]));

    const data = await useCase.execute({ establishmentCode, userId }).then((r) => r.getData());

    expect(data).toHaveLength(1);
  });

  it('returns customer bookings when user does not own the establishment', async () => {
    const mockEst = Establishment.reconstruct({
      id: 'uuid-est',
      code: establishmentCode,
      name: 'Salon',
      userId: 'other-user',
    });
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEst));
    bookingRepository.findByCustomer.mockResolvedValue(ok([mockBooking]));

    const data = await useCase.execute({ establishmentCode, userId }).then((r) => r.getData());

    expect(data).toHaveLength(1);
  });

  it('returns empty array when establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const data = await useCase.execute({ establishmentCode, userId }).then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns storage error when booking repository fails', async () => {
    bookingRepository.findByCustomer.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ userId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});
