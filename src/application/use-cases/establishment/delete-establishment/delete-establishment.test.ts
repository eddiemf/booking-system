import { EstablishmentEntity, type EstablishmentRepository } from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteEstablishment } from './delete-establishment';

describe('DeleteEstablishment', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new DeleteEstablishment(establishmentRepository);

  const userId = 'uuid-user';
  const mockEstablishment = EstablishmentEntity.reconstruct({
    id: 'uuid-1',
    code: 'abc123',
    name: 'Salon',
    userId,
  });

  it('returns a not-found error when the establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ code: 'abc123', userId })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns a forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

    const error = await useCase
      .execute({ code: 'abc123', userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns a conflict error when the establishment has associated services', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    establishmentRepository.delete.mockResolvedValue(
      fail(new ConflictError('Establishment has associated services or bookings.'))
    );

    const error = await useCase
      .execute({ code: 'abc123', userId })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe('Establishment has associated services or bookings.');
  });

  it('returns a storage error when the repository fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    const error = new StorageError('Failed to delete establishment.');
    establishmentRepository.delete.mockResolvedValue(fail(error));

    const result = await useCase
      .execute({ code: 'abc123', userId })
      .then((result) => result.getError());

    expect(result).toBe(error);
  });

  it('returns ok on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    establishmentRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute({ code: 'abc123', userId });

    expect(result.isOk).toBe(true);
  });
});
