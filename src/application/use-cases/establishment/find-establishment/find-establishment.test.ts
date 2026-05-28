import { Establishment, type EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { FindEstablishment } from './find-establishment';

describe('FindEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new FindEstablishment(establishmentRepository);

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute({ code: 'abc123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Establishment with id abc123 was not found.');
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to find establishment.');
    establishmentRepository.findByCode.mockResolvedValue(fail(error));

    const result = await useCase.execute({ code: 'abc123' }).then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns an establishment DTO when found', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok(
        Establishment.reconstruct({
          id: 'uuid-1',
          code: 'abc123',
          name: 'My Salon',
          userId: 'uuid-user',
        })
      )
    );

    const data = await useCase.execute({ code: 'abc123' }).then((result) => result.getData());

    expect(data).toEqual({ id: 'abc123', name: 'My Salon' });
  });
});
