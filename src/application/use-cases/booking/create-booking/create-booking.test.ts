import {
  Booking,
  type BookingRepository,
  Resource,
  type ResourceRepository,
  Service,
  ServiceOffering,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok } from '@shared/result';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateBooking } from './create-booking';

describe('CreateBooking', () => {
  const bookingRepository = mock<BookingRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const availabilityService = mock<AvailabilityService>();
  const useCase = new CreateBooking(
    bookingRepository,
    serviceRepository,
    resourceRepository,
    serviceOfferingRepository,
    availabilityService
  );

  const establishmentCode = 'est123';
  const serviceCode = 'svc123';
  const resourceCode = 'res123';
  const userId = 'uuid-user';
  const userCode = 'usr123';
  const userName = 'Alice';
  const futureStartsAt = new Date(Date.now() + 86400000).toISOString();
  const futureEndsAt = new Date(Date.now() + 86400000 + 3600000).toISOString();

  const mockService = Service.reconstruct({
    id: 'uuid-svc',
    code: serviceCode,
    name: 'Haircut',
    description: '',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode,
  });

  const mockResource = Resource.reconstruct({
    id: 'uuid-res',
    code: resourceCode,
    name: 'Bob',
    establishmentId: 'uuid-est',
    establishmentCode,
  });

  const mockOffering = ServiceOffering.reconstruct({
    id: 'uuid-off',
    code: 'off1',
    serviceId: 'uuid-svc',
    resourceId: 'uuid-res',
    maxCapacity: 1,
    durationMinutes: 60,
    slotIntervalMinutes: 30,
    price: 0,
  });

  const validInput = {
    serviceCode,
    resourceCode,
    establishmentCode,
    startsAt: futureStartsAt,
    userId,
    userCode,
    userName,
  };

  beforeEach(() => {
    availabilityService.resolveTimeSlot.mockReturnValue(
      ok({ startsAt: futureStartsAt, endsAt: futureEndsAt })
    );
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    bookingRepository.getOverlapping.mockResolvedValue(ok([]));
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource does not exist', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    const otherResource = Resource.reconstruct({
      id: 'uuid-res',
      code: resourceCode,
      name: 'Bob',
      establishmentId: 'uuid-est-other',
      establishmentCode: 'other-est',
    });
    resourceRepository.findByCode.mockResolvedValue(ok(otherResource));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource is not assigned to the service', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([]));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when resource is already booked at that time', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    const overlappingBooking = Booking.reconstruct({
      id: 'overlap',
      code: 'overlap',
      customerId: 'other',
      customerCode: 'other',
      customerName: 'Other',
      establishmentId: 'uuid-est',
      establishmentCode: 'est123',
      serviceId: 'uuid-svc',
      serviceCode: 'svc1',
      serviceName: 'Other',
      resourceId: 'uuid-res',
      resourceCode: 'res',
      resourceName: 'Other',
      startsAt: '2026-06-15T09:00:00Z',
      endsAt: '2026-06-15T10:00:00Z',
      status: 'confirmed',
      servicePrice: 0,
      serviceDuration: 60,
    });
    bookingRepository.getOverlapping.mockResolvedValue(ok([overlappingBooking]));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns validation error for invalid startsAt', async () => {
    availabilityService.resolveTimeSlot.mockReturnValue(
      fail(new ValidationError('startsAt', 'Must be in the future.'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when save fails', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    bookingRepository.getOverlapping.mockResolvedValue(ok([]));
    bookingRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns booking DTO on success', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    bookingRepository.getOverlapping.mockResolvedValue(ok([]));
    bookingRepository.save.mockResolvedValue(ok(undefined));

    const data = await useCase.execute(validInput).then((r) => r.getData());

    expect(data).toBeDefined();
    expect(data.serviceCode).toBe(serviceCode);
    expect(data.resourceCode).toBe(resourceCode);
    expect(data.establishmentCode).toBe(establishmentCode);
    expect(data.status).toBe('confirmed');
  });
});
