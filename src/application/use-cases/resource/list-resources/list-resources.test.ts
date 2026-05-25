import {
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListResources } from './list-resources';

describe('ListResources', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new ListResources(establishmentRepository, resourceRepository);

  const establishmentId = '1';
  const mockResource = ResourceEntity.reconstruct({
    id: '10',
    name: 'Alice',
    type: 'employee',
    establishmentId,
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase.execute({ establishmentId }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when establishment lookup fails', async () => {
    establishmentRepository.findById.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentId }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns storage error when resource listing fails', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    resourceRepository.findAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentId }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns list of resource DTOs on success', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    resourceRepository.findAll.mockResolvedValue(ok([mockResource]));

    const data = await useCase.execute({ establishmentId }).then((result) => result.getData());

    expect(data).toEqual([{ id: '10', name: 'Alice', type: 'employee', establishmentId }]);
  });

  it('passes type filter to the repository', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    resourceRepository.findAll.mockResolvedValue(ok([]));

    await useCase.execute({ establishmentId, type: 'room' });

    expect(resourceRepository.findAll).toHaveBeenCalledWith(establishmentId, 'room');
  });
});
