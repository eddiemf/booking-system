import { Establishment, Resource, type ResourceRepository } from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteResource } from './delete-resource';

describe('DeleteResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new DeleteResource(resourceRepository, establishmentLoader);

  const userId = 'uuid-user';
  const existingResource = Resource.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  const validInput = { code: 'res123', establishmentCode: 'est123', userId };

  it('returns not-found error when resource does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

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

  it('returns not-found error when resource belongs to another establishment', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ ...validInput, establishmentCode: 'other-est' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when resource has future bookings', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(
      fail(new ConflictError('Resource has future bookings.'))
    );

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when delete fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(validInput);

    expect(result.isOk).toBe(true);
  });
});
