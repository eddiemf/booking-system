import {
  Establishment,
  Resource,
  type ResourceRepository,
  Service,
  ServiceOffering,
  type ServiceOfferingRepository,
} from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader, ServiceLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateServiceOffering } from './create-service-offering';

describe('CreateServiceOffering', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const serviceLoader = mock<ServiceLoader>();
  const resourceLoader = mock<ResourceLoader>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new CreateServiceOffering(
    serviceOfferingRepository,
    serviceLoader,
    resourceLoader,
    establishmentLoader
  );

  const userId = 'uuid-user';
  const validInput = {
    serviceCode: 'svc123',
    resourceCode: 'res123',
    establishmentCode: 'est123',
    userId,
    duration: 30,
    slotInterval: 30,
    maxCapacity: 1,
    price: 50,
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
    serviceLoader.load.mockResolvedValue(fail(new NotFoundError('Service', 'svc123')));
    resourceLoader.load.mockResolvedValue(ok(mockResource));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(mockService));
    resourceLoader.load.mockResolvedValue(fail(new NotFoundError('Resource', 'res123')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when assign fails due to duplication', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(mockService));
    resourceLoader.load.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(
      fail(new ConflictError('Already assigned.'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when assign fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(mockService));
    resourceLoader.load.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.assign.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns service offering DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(mockService));
    resourceLoader.load.mockResolvedValue(ok(mockResource));
    const assignedEntity = ServiceOffering.reconstruct({
      id: 'uuid-so',
      code: 'so123',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      price: 50,
    });
    serviceOfferingRepository.assign.mockResolvedValue(ok(assignedEntity));

    const data = await useCase.execute(validInput).then((r) => r.getData());

    expect(data).toMatchObject({
      serviceCode: 'svc123',
      resourceName: 'Alice',
      maxCapacity: 1,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      price: 50,
    });
  });

  it('returns service offering DTO with defaults when optional values are not provided', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(mockService));
    resourceLoader.load.mockResolvedValue(ok(mockResource));
    const assignedEntity = ServiceOffering.reconstruct({
      id: 'uuid-so',
      code: 'so123',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res',
      maxCapacity: 0,
      durationMinutes: 60,
      slotIntervalMinutes: 30,
      price: 0,
    });
    serviceOfferingRepository.assign.mockResolvedValue(ok(assignedEntity));

    const data = await useCase
      .execute({
        serviceCode: 'svc123',
        resourceCode: 'res123',
        establishmentCode: 'est123',
        userId,
        duration: 60,
        slotInterval: 30,
      })
      .then((r) => r.getData());

    expect(data).toMatchObject({
      serviceCode: 'svc123',
      resourceName: 'Alice',
      maxCapacity: 1,
      durationMinutes: 60,
      slotIntervalMinutes: 30,
      price: 0,
    });
  });
});
