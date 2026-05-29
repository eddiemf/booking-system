import { Establishment, Resource, type ResourceRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateResource } from './update-resource';

describe('UpdateResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const resourceLoader = mock<ResourceLoader>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new UpdateResource(resourceRepository, resourceLoader, establishmentLoader);

  const userId = 'uuid-user';
  const validInput = { code: 'res123', establishmentCode: 'est123', name: 'Room A', userId };
  const existingEntity = Resource.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Old Name',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns validation error for empty name', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingEntity));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(fail(new NotFoundError('Resource', 'res123')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
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

  it('returns storage error when update fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingEntity));
    resourceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated resource DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingEntity));
    resourceRepository.update.mockResolvedValue(ok(existingEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({ id: 'res123', name: 'Room A', establishmentCode: 'est123' });
  });
});
