import { Establishment, Service, type ServiceRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader, ServiceLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateService } from './update-service';

describe('UpdateService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const serviceLoader = mock<ServiceLoader>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new UpdateService(serviceRepository, serviceLoader, establishmentLoader);

  const userId = 'uuid-user';
  const validInput = {
    code: 'svc123',
    establishmentCode: 'est123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    userId,
  };

  const existingEntity = Service.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns validation error for invalid name', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(existingEntity));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns validation error for invalid duration', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(existingEntity));

    const error = await useCase
      .execute({ ...validInput, duration: 0 })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when service does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(fail(new NotFoundError('Service', 'svc123')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(existingEntity));
    serviceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated service DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceLoader.load.mockResolvedValue(ok(existingEntity));
    serviceRepository.update.mockResolvedValue(ok(undefined));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'svc123',
      name: 'Haircut',
      description: 'Updated',
      duration: 45,
      establishmentCode: 'est123',
    });
  });
});
