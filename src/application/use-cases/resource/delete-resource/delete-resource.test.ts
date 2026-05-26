import type { ResourceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteResource } from './delete-resource';

describe('DeleteResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new DeleteResource(resourceRepository);

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.delete.mockResolvedValue(fail(new NotFoundError('Resource', 'res123')));

    const error = await useCase.execute({ code: 'res123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when resource has future bookings', async () => {
    resourceRepository.delete.mockResolvedValue(
      fail(new ConflictError('Resource has future bookings.'))
    );

    const error = await useCase.execute({ code: 'res123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when delete fails', async () => {
    resourceRepository.delete.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ code: 'res123' }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    resourceRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute({ code: 'res123' });

    expect(result.isOk).toBe(true);
  });
});
