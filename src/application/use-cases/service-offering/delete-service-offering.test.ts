import {
  Establishment,
  Resource,
  type ResourceRepository,
  Service,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteServiceOffering } from './delete-service-offering';

describe('DeleteServiceOffering', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new DeleteServiceOffering(
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

  it('returns not-found error when the link does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(
      fail(new NotFoundError('ServiceOffering', 'uuid-svc:uuid-res'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when unassign fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(validInput);

    expect(result.isOk).toBe(true);
  });
});
