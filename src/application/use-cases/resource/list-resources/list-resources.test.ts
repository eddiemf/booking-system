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

  const establishmentCode = 'est123';
  const mockResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    type: 'employee',
    establishmentId: 'uuid-est',
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

  it('returns storage error when resource listing fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: establishmentCode, name: 'Salon' } as never)
    );
    resourceRepository.findAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns list of resource DTOs on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: establishmentCode, name: 'Salon' } as never)
    );
    resourceRepository.findAll.mockResolvedValue(ok([mockResource]));

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([
      { id: 'res123', name: 'Alice', type: 'employee', establishmentId: 'uuid-est' },
    ]);
  });

  it('passes type filter to the repository', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: establishmentCode, name: 'Salon' } as never)
    );
    resourceRepository.findAll.mockResolvedValue(ok([]));

    await useCase.execute({ establishmentCode, type: 'room' });

    expect(resourceRepository.findAll).toHaveBeenCalledWith(establishmentCode, 'room');
  });
});
