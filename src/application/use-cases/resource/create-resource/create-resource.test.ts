import { ResourceEntity, type ResourceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateResource } from './create-resource';

describe('CreateResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new CreateResource(resourceRepository);

  const validInput = { name: 'Alice', type: 'employee' as const, establishmentId: '1' };
  const savedEntity = ResourceEntity.reconstruct({
    id: '10',
    name: 'Alice',
    type: 'employee',
    establishmentId: '1',
  });

  it('returns validation error for empty name', async () => {
    const error = await useCase.execute({ ...validInput, name: '' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when establishment does not exist', async () => {
    resourceRepository.save.mockResolvedValue(fail(new NotFoundError('Establishment', '1')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when save fails', async () => {
    resourceRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns resource DTO on success', async () => {
    resourceRepository.save.mockResolvedValue(ok(savedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({ id: '10', name: 'Alice', type: 'employee', establishmentId: '1' });
  });
});
