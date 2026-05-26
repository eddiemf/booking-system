import {
  EstablishmentEntity,
  type EstablishmentRepository,
  ResourceEntity,
} from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListResources } from './list-resources';

describe('ListResources', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new ListResources(establishmentRepository);

  const establishmentCode = 'est123';
  const mockResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when establishment lookup fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns list of resource DTOs on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok(
        EstablishmentEntity.reconstruct({
          id: 'uuid-est',
          code: establishmentCode,
          name: 'Salon',
          resources: [mockResource],
        })
      )
    );

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([{ id: 'res123', name: 'Alice', establishmentCode: 'est123' }]);
  });

  it('returns an empty array when establishment has no resources', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok(
        EstablishmentEntity.reconstruct({ id: 'uuid-est', code: establishmentCode, name: 'Salon' })
      )
    );

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
