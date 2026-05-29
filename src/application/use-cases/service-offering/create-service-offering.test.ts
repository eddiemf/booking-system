import {
  Establishment,
  Resource,
  type ResourceRepository,
  Service,
  ServiceOffering,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateServiceOffering } from './create-service-offering';

describe('CreateServiceOffering', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new CreateServiceOffering(
    serviceOfferingRepository,
    serviceRepository,
    resourceRepository,
    establishmentLoader
  );

  const userId = 'uuid-user';
  const validInput = {
    serviceCode: 'svc123',
    resourceCode: 'res123',
    establishmentCode: 'est123',
    userId,
    duration: 60,
    slotInterval: 30,
  };

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  const mockService = Service.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: '',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockResource = Resource.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when service does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(null));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    const otherEstablishmentResource = Resource.reconstruct({
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
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(
      fail(new ConflictError('Resource is already assigned to this service.'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when assign fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(
      ok(
        ServiceOffering.reconstruct({
          id: 'uuid-link',
          code: 'link1',
          serviceId: 'uuid-svc',
          resourceId: 'uuid-res',
          maxCapacity: 1,
          durationMinutes: 60,
          slotIntervalMinutes: 30,
          price: 0,
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
      price: 0,
    });
  });
});
