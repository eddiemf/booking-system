import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { FindEstablishment } from './find-establishment';

describe('FindEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new FindEstablishment(establishmentRepository);

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase.execute({ id: '99' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Establishment with id 99 was not found.');
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to find establishment.');
    establishmentRepository.findById.mockResolvedValue(fail(error));

    const result = await useCase.execute({ id: '1' }).then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns an establishment DTO when found', async () => {
    establishmentRepository.findById.mockResolvedValue(
      ok(EstablishmentEntity.reconstruct({ id: '1', name: 'My Salon' }))
    );

    const data = await useCase.execute({ id: '1' }).then((result) => result.getData());

    expect(data).toEqual({ id: '1', name: 'My Salon' });
  });
});
