import { Establishment, type EstablishmentRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateEstablishment } from './update-establishment';

describe('UpdateEstablishment', () => {
  const establishmentLoader = mock<EstablishmentLoader>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new UpdateEstablishment(establishmentLoader, establishmentRepository);

  const userId = 'uuid-user';
  const existing = Establishment.reconstruct({
    id: 'uuid-1',
    code: 'abc123',
    name: 'Old Name',
    userId,
  });

  const validInput = { code: 'abc123', name: 'New Name', userId };

  it('returns a validation error if name is empty', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(existing));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new NotFoundError('Establishment', 'abc123'))
    );

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns a forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to update establishment.');
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(existing));
    establishmentRepository.update.mockResolvedValue(fail(error));

    const result = await useCase.execute(validInput).then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns the updated establishment DTO on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(existing));
    establishmentRepository.update.mockResolvedValue(ok(existing));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({ id: 'abc123', name: 'New Name', timezone: 'UTC' });
  });
});
