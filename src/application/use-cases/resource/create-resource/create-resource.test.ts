import { Establishment, type ResourceRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateResource } from './create-resource';

describe('CreateResource', () => {
  const establishmentLoader = mock<EstablishmentLoader>();
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new CreateResource(establishmentLoader, resourceRepository);

  const userId = 'uuid-user';
  const validInput = { name: 'Alice', establishmentCode: 'est123', userId };

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns validation error for empty name', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new NotFoundError('Establishment', 'est123'))
    );

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

  it('returns storage error when save fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns resource DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.save.mockResolvedValue(ok(undefined));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toMatchObject({
      name: 'Alice',
      establishmentCode: 'est123',
    });
    expect(typeof data.id).toBe('string');
  });
});
