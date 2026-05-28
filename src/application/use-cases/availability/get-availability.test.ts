import {
  ResourceEntity,
  type ResourceRepository,
  ServiceEntity,
  ServiceOfferingEntity,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok } from '@shared/result';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { GetAvailability } from './get-availability';

describe('GetAvailability', () => {
  const serviceRepository = mock<ServiceRepository>();
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const availabilityService = mock<AvailabilityService>();
  const useCase = new GetAvailability(
    serviceRepository,
    serviceOfferingRepository,
    resourceRepository,
    availabilityService
  );

  const serviceCode = 'svc123';
  const establishmentCode = 'est123';
  const date = '2026-06-03'; // Wednesday (dayOfWeek = 3)

  beforeEach(() => {
    availabilityService.validateDate.mockReturnValue(ok(undefined));
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

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when service lookup fails', async () => {
    serviceRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns empty array when no resources are assigned to the service', async () => {
    const service = ServiceEntity.reconstruct({
      id: 'uuid-svc',
      code: serviceCode,
      name: 'Haircut',
      description: '',
      duration: 30,
      establishmentId: 'uuid-est',
      establishmentCode,
    });
    serviceRepository.findByCode.mockResolvedValue(ok(service));
    serviceOfferingRepository.findByServiceCode.mockResolvedValue(ok([]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns available slots from resource schedules', async () => {
    const service = ServiceEntity.reconstruct({
      id: 'uuid-svc',
      code: serviceCode,
      name: 'Haircut',
      description: '',
      duration: 60,
      establishmentId: 'uuid-est',
      establishmentCode,
    });
    serviceRepository.findByCode.mockResolvedValue(ok(service));

    const offering = ServiceOfferingEntity.reconstruct({
      id: 'uuid-offering',
      code: 'off1',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res',
      maxCapacity: 1,
      durationMinutes: 60,
      slotIntervalMinutes: 30,
    });

    serviceOfferingRepository.findByServiceCode.mockResolvedValue(ok([offering]));

    availabilityService.generateResourceSlots.mockReturnValue([
      { startTime: '09:00', endTime: '10:00', resourceCode: 'res123', resourceName: 'Alice' },
      { startTime: '10:00', endTime: '11:00', resourceCode: 'res123', resourceName: 'Alice' },
    ]);

    const resource = ResourceEntity.reconstruct({
      id: 'uuid-res',
      code: 'res123',
      name: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });

    resourceRepository.findByIds.mockResolvedValue(ok([resource]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([
      { startTime: '09:00', endTime: '10:00', resourceCode: 'res123', resourceName: 'Alice' },
      { startTime: '10:00', endTime: '11:00', resourceCode: 'res123', resourceName: 'Alice' },
    ]);
  });

  it('returns empty array when domain service returns no slots', async () => {
    const service = ServiceEntity.reconstruct({
      id: 'uuid-svc',
      code: serviceCode,
      name: 'Haircut',
      description: '',
      duration: 30,
      establishmentId: 'uuid-est',
      establishmentCode,
    });
    serviceRepository.findByCode.mockResolvedValue(ok(service));

    const emptyOffering = ServiceOfferingEntity.reconstruct({
      id: 'uuid-offering',
      code: 'off1',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res',
      maxCapacity: 1,
      durationMinutes: 60,
      slotIntervalMinutes: 30,
    });

    serviceOfferingRepository.findByServiceCode.mockResolvedValue(ok([emptyOffering]));

    availabilityService.generateResourceSlots.mockReturnValue([]);

    const resource = ResourceEntity.reconstruct({
      id: 'uuid-res',
      code: 'res123',
      name: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });

    resourceRepository.findByIds.mockResolvedValue(ok([resource]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toEqual([]);
  });

  it('returns slots from multiple resources', async () => {
    const service = ServiceEntity.reconstruct({
      id: 'uuid-svc',
      code: serviceCode,
      name: 'Haircut',
      description: '',
      duration: 30,
      establishmentId: 'uuid-est',
      establishmentCode,
    });
    serviceRepository.findByCode.mockResolvedValue(ok(service));

    const multiOffering1 = ServiceOfferingEntity.reconstruct({
      id: 'l1',
      code: 'l1',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res-1',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
    });

    const multiOffering2 = ServiceOfferingEntity.reconstruct({
      id: 'l2',
      code: 'l2',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res-2',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
    });

    serviceOfferingRepository.findByServiceCode.mockResolvedValue(
      ok([multiOffering1, multiOffering2])
    );

    availabilityService.generateResourceSlots
      .mockReturnValueOnce([
        { startTime: '09:00', endTime: '09:30', resourceCode: 'res1', resourceName: 'Alice' },
      ])
      .mockReturnValueOnce([
        { startTime: '10:00', endTime: '10:30', resourceCode: 'res2', resourceName: 'Bob' },
      ]);

    const resource1 = ResourceEntity.reconstruct({
      id: 'uuid-res-1',
      code: 'res1',
      name: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });

    const resource2 = ResourceEntity.reconstruct({
      id: 'uuid-res-2',
      code: 'res2',
      name: 'Bob',
      establishmentId: 'uuid-est',
      establishmentCode,
      schedules: [],
    });

    resourceRepository.findByIds.mockResolvedValue(ok([resource1, resource2]));

    const data = await useCase
      .execute({ serviceCode, establishmentCode, date })
      .then((r) => r.getData());

    expect(data).toHaveLength(2);
    expect(data[0]?.resourceCode).toBe('res1');
    expect(data[1]?.resourceCode).toBe('res2');
  });
});
