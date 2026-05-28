import {
  EstablishmentEntity,
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
  ServiceEntity,
  ServiceOfferingEntity,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateServiceOffering } from './create-service-offering';

describe('CreateServiceOffering', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new CreateServiceOffering(
    serviceOfferingRepository,
    serviceRepository,
    resourceRepository,
    establishmentRepository
  );

  const userId = 'uuid-user';
  const validInput = {
    serviceCode: 'svc123',
    resourceCode: 'res123',
    establishmentCode: 'est123',
    userId,
    durationMinutes: 60,
    slotIntervalMinutes: 30,
  };

  const mockEstablishment = EstablishmentEntity.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  const mockService = ServiceEntity.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: '',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when service does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    const otherEstablishmentResource = ResourceEntity.reconstruct({
      id: 'uuid-res',
      code: 'res123',
      name: 'Alice',
      establishmentId: 'uuid-est-other',
      establishmentCode: 'other-est',
    });
    resourceRepository.findByCode.mockResolvedValue(ok(otherEstablishmentResource));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when already assigned', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(
      fail(new ConflictError('Resource is already assigned to this service.'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when assign fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(
      ok(
        ServiceOfferingEntity.reconstruct({
          id: 'uuid-link',
          code: 'link1',
          serviceId: 'uuid-svc',
          resourceId: 'uuid-res',
          maxCapacity: 1,
          durationMinutes: 60,
          slotIntervalMinutes: 30,
        })
      )
    );

    const data = await useCase.execute(validInput).then((r) => r.getData());

    expect(data).toEqual({
      id: 'link1',
      serviceCode: 'svc123',
      resourceCode: 'res123',
      resourceName: 'Alice',
      maxCapacity: 1,
      durationMinutes: 60,
      slotIntervalMinutes: 30,
    });
  });
});
