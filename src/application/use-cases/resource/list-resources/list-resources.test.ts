import type { ResourceRepository } from '@app/domain/entities';
import { ResourceEntity } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListResources } from './list-resources';

describe('ListResources', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new ListResources(resourceRepository);

  const establishmentCode = 'est123';
  const mockResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns storage error when repository fails', async () => {
    resourceRepository.findAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns list of resource DTOs on success', async () => {
    resourceRepository.findAll.mockResolvedValue(ok([mockResource]));

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([{ id: 'res123', name: 'Alice', establishmentCode: 'est123' }]);
  });

  it('returns an empty array when establishment has no resources', async () => {
    resourceRepository.findAll.mockResolvedValue(ok([]));

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
