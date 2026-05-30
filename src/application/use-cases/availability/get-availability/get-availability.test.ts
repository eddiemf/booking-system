import {
  type BookingRepository,
  Establishment,
  type EstablishmentRepository,
  Resource,
  type ResourceRepository,
  ServiceOffering,
  type ServiceOfferingRepository,
} from '@app/domain/entities';
import { StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok } from '@shared/result';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { GetAvailability } from './get-availability';

describe('GetAvailability', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const bookingRepository = mock<BookingRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const availabilityService = mock<AvailabilityService>();
  const useCase = new GetAvailability(
    serviceOfferingRepository,
    resourceRepository,
    bookingRepository,
    establishmentRepository,
    availabilityService
  );

  const serviceCode = 'svc123';
  const establishmentCode = 'est123';
  const date = '2026-06-03';

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: establishmentCode,
    name: 'Salon',
    userId: 'uuid-user',
    timezone: 'Europe/Warsaw',
  });

  const mockOffering = ServiceOffering.reconstruct({
    id: 'uuid-offering',
    code: 'off1',
    serviceId: 'uuid-svc',
    resourceId: 'uuid-res',
    maxCapacity: 1,
    durationMinutes: 60,
    slotIntervalMinutes: 30,
    price: 0,
  });

  const mockResource = Resource.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode,
    schedules: [],
  });

  beforeEach(() => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    availabilityService.validateDate.mockReturnValue(ok(undefined));
    bookingRepository.getByResourcesAndDate.mockResolvedValue(ok([]));
  });

  it('returns validation error when date is in the past', async () => {
    availabilityService.validateDate.mockReturnValue(
      fail(new ValidationError('date', 'Must not be in the past.'))
    );

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date: '2020-01-01' })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toContain('past');
  });

  it('returns empty array when no resources are assigned to the service', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns empty array when establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns available slots from resource schedules', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    availabilityService.generateResourceSlots.mockReturnValue([
      {
        startTime: '09:00',
        endTime: '10:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      },
      {
        startTime: '10:00',
        endTime: '11:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      },
    ]);
    resourceRepository.getByIds.mockResolvedValue(ok([mockResource]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([
      {
        startTime: '09:00',
        endTime: '10:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      },
      {
        startTime: '10:00',
        endTime: '11:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      },
    ]);
  });

  it('returns empty array when domain service returns no slots', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    availabilityService.generateResourceSlots.mockReturnValue([]);
    resourceRepository.getByIds.mockResolvedValue(ok([mockResource]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns slots from multiple resources', async () => {
    const offering1 = ServiceOffering.reconstruct({
      id: 'l1',
      code: 'l1',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res-1',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      price: 0,
    });
    const offering2 = ServiceOffering.reconstruct({
      id: 'l2',
      code: 'l2',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res-2',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      price: 0,
    });
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([offering1, offering2]));

    availabilityService.generateResourceSlots
      .mockReturnValueOnce([
        {
          startTime: '09:00',
          endTime: '09:30',
          resourceCode: 'res1',
          resourceName: 'Alice',
          price: 0,
        },
      ])
      .mockReturnValueOnce([
        {
          startTime: '10:00',
          endTime: '10:30',
          resourceCode: 'res2',
          resourceName: 'Bob',
          price: 0,
        },
      ]);

    const resource1 = Resource.reconstruct({
      id: 'uuid-res-1',
      code: 'res1',
      name: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });
    const resource2 = Resource.reconstruct({
      id: 'uuid-res-2',
      code: 'res2',
      name: 'Bob',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });
    resourceRepository.getByIds.mockResolvedValue(ok([resource1, resource2]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toHaveLength(2);
    expect(data[0]?.resourceCode).toBe('res1');
    expect(data[1]?.resourceCode).toBe('res2');
  });

  it('returns storage error when offerings lookup fails', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(
      fail(new StorageError('DB error'))
    );

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns storage error when resources lookup fails', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    resourceRepository.getByIds.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns storage error when booking lookup fails', async () => {
    serviceOfferingRepository.getByServiceCode.mockResolvedValue(ok([mockOffering]));
    resourceRepository.getByIds.mockResolvedValue(ok([mockResource]));
    bookingRepository.getByResourcesAndDate.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns storage error when establishment lookup fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});
