import type { EstablishmentRepository } from '@app/domain/entities';
import { Establishment } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListEstablishments } from './list-establishments';

describe('ListEstablishments', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new ListEstablishments(establishmentRepository);

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-1',
    code: 'est123',
    name: 'Salon',
    userId: 'uuid-user',
  });

  it('returns storage error when repository fails', async () => {
    establishmentRepository.get.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ limit: 10, offset: 0 })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns list of establishment DTOs on success', async () => {
    establishmentRepository.get.mockResolvedValue(ok([mockEstablishment]));

    const data = await useCase.execute({ limit: 10, offset: 0 }).then((result) => result.getData());

    expect(data).toEqual([{ id: 'est123', name: 'Salon', timezone: 'UTC' }]);
  });

  it('returns an empty array when no establishments exist', async () => {
    establishmentRepository.get.mockResolvedValue(ok([]));

    const data = await useCase.execute({ limit: 10, offset: 0 }).then((result) => result.getData());

    expect(data).toEqual([]);
  });

  it('passes limit and offset to the repository', async () => {
    establishmentRepository.get.mockResolvedValue(ok([]));

    await useCase.execute({ limit: 10, offset: 5 });

    expect(establishmentRepository.get).toHaveBeenCalledWith(10, 5);
  });
});
