import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateEstablishment } from './update-establishment';

describe('UpdateEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new UpdateEstablishment(establishmentRepository);

  const existing = EstablishmentEntity.reconstruct({
    id: 'uuid-1',
    code: 'abc123',
    name: 'Old Name',
  });

  it('returns a validation error if name is empty', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(existing));

    const error = await useCase
      .execute({ code: 'abc123', name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Establishment with id abc123 was not found.');
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to update establishment.');
    establishmentRepository.findByCode.mockResolvedValue(ok(existing));
    establishmentRepository.update.mockResolvedValue(fail(error));

    const result = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns the updated establishment DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(existing));
    establishmentRepository.update.mockResolvedValue(
      ok(EstablishmentEntity.reconstruct({ id: 'uuid-1', code: 'abc123', name: 'New Name' }))
    );

    const data = await useCase
      .execute({ code: 'abc123', name: 'New Name' })
      .then((result) => result.getData());

    expect(data).toEqual({ id: 'abc123', name: 'New Name' });
  });
});
