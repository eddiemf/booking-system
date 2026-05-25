import { ResourceEntity, type ResourceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateResource } from './update-resource';

describe('UpdateResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new UpdateResource(resourceRepository);

  const validInput = { id: '10', name: 'Room A', type: 'room' as const };
  const updatedEntity = ResourceEntity.reconstruct({
    id: '10',
    name: 'Room A',
    type: 'room',
    establishmentId: '1',
  });

  it('returns validation error for empty name', async () => {
    const error = await useCase.execute({ ...validInput, name: '' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.update.mockResolvedValue(fail(new NotFoundError('Resource', '10')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    resourceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated resource DTO on success', async () => {
    resourceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({ id: '10', name: 'Room A', type: 'room', establishmentId: '1' });
  });
});
