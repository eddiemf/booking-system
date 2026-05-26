import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateEstablishment } from './update-establishment';

describe('UpdateEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new UpdateEstablishment(establishmentRepository);

  it('returns a validation error if name is empty', async () => {
    const error = await useCase
      .execute({ code: 'abc123', name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.update.mockResolvedValue(
      fail(new NotFoundError('Establishment', 'abc123'))
    );

    const error = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Establishment with id abc123 was not found.');
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to update establishment.');
    establishmentRepository.update.mockResolvedValue(fail(error));

    const result = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns the updated establishment DTO on success', async () => {
    establishmentRepository.update.mockResolvedValue(
      ok(EstablishmentEntity.reconstruct({ id: 'uuid-1', code: 'abc123', name: 'New Name' }))
    );

    const data = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getData());

    expect(data).toEqual({ id: 'abc123', name: 'New Name' });
  });
});
