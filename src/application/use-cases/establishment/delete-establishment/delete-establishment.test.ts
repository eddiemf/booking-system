import type { EstablishmentRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteEstablishment } from './delete-establishment';

describe('DeleteEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new DeleteEstablishment(establishmentRepository);

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.delete.mockResolvedValue(
      fail(new NotFoundError('Establishment', 'abc123'))
    );

    const error = await useCase.execute({ code: 'abc123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns a conflict error when the establishment has associated services', async () => {
    establishmentRepository.delete.mockResolvedValue(
      fail(new ConflictError('Establishment has associated services or bookings.'))
    );

    const error = await useCase.execute({ code: 'abc123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe('Establishment has associated services or bookings.');
  });

  it('returns a storage error when the repository fails', async () => {
    const error = new StorageError('Failed to delete establishment.');
    establishmentRepository.delete.mockResolvedValue(fail(error));

    const result = await useCase.execute({ code: 'abc123' }).then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns ok on success', async () => {
    establishmentRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute({ code: 'abc123' });

    expect(result.isOk).toBe(true);
  });
});
