import { Resource, type ResourceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ResourceLoader } from './resource-loader';

describe('ResourceLoader', () => {
  const resourceRepository = mock<ResourceRepository>();
  const loader = new ResourceLoader(resourceRepository);

  const establishmentCode = 'est123';
  const mockResource = Resource.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode,
  });

  it('returns resource when found and scoped to establishment', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));

    const data = await loader.load('res123', establishmentCode).then((r) => r.getData());

    expect(data).toBe(mockResource);
  });

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await loader.load('res123', establishmentCode).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    resourceRepository.findByCode.mockResolvedValue(ok(mockResource));

    const error = await loader.load('res123', 'other-est').then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('forwards storage error', async () => {
    resourceRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await loader.load('res123', establishmentCode).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});
