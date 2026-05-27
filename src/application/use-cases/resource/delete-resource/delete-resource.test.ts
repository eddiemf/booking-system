import { ResourceEntity, type ResourceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteResource } from './delete-resource';

describe('DeleteResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new DeleteResource(resourceRepository);

  const existingResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ code: 'res123', establishmentCode: 'est123' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ code: 'res123', establishmentCode: 'other-est' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when resource has future bookings', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(
      fail(new ConflictError('Resource has future bookings.'))
    );

    const error = await useCase
      .execute({ code: 'res123', establishmentCode: 'est123' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when delete fails', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ code: 'res123', establishmentCode: 'est123' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    resourceRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute({ code: 'res123', establishmentCode: 'est123' });

    expect(result.isOk).toBe(true);
  });
});
