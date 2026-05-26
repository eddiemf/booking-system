import { ResourceEntity, type ResourceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateResource } from './update-resource';

describe('UpdateResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new UpdateResource(resourceRepository);

  const validInput = { code: 'res123', name: 'Room A' };
  const updatedEntity = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Room A',
    establishmentId: 'uuid-est',
  });

  it('returns validation error for empty name', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    resourceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated resource DTO on success', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    resourceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'res123',
      name: 'Room A',
      establishmentId: 'uuid-est',
    });
  });
});
