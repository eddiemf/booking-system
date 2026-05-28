import {
  EstablishmentEntity,
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
  ServiceEntity,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteServiceOffering } from './delete-service-offering';

describe('DeleteServiceOffering', () => {
  const serviceOfferingRepository = mock<ServiceOfferingRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new DeleteServiceOffering(
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

  it('returns not-found error when the link does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(
      fail(new NotFoundError('ServiceOffering', 'uuid-svc:uuid-res'))
    );

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when unassign fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));
    serviceOfferingRepository.unassign.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(validInput);

    expect(result.isOk).toBe(true);
  });
});
