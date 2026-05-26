import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateEstablishment } from './create-establishment';

describe('CreateEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();

  const useCase = new CreateEstablishment(establishmentRepository);

  it('returns a validation error if creating the entity returns a validation error', async () => {
    const resultError = await useCase.execute({ name: '' }).then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ValidationError);
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    const error = new StorageError('Failed to save the entity');
    establishmentRepository.save.mockResolvedValue(fail(error));

    const resultError = await useCase
      .execute({ name: 'My Salon' })
      .then((result) => result.getError());

    expect(establishmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Salon' })
    );
    expect(resultError).toBe(error);
  });

  it('returns an establishment DTO when creation was successful', async () => {
    establishmentRepository.save.mockResolvedValue(
      ok(EstablishmentEntity.reconstruct({ id: 'uuid-42', code: 'est123', name: 'My Salon' }))
    );

    const data = await useCase.execute({ name: 'My Salon' }).then((result) => result.getData());

    expect(data).toEqual({ id: 'est123', name: 'My Salon' });
  });
});
