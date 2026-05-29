import { Service } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import type { ServiceLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { FindService } from './find-service';

describe('FindService', () => {
  const serviceLoader = mock<ServiceLoader>();
  const useCase = new FindService(serviceLoader);

  it('returns not-found error when service does not exist', async () => {
    serviceLoader.load.mockResolvedValue(fail(new NotFoundError('Service', 'svc123')));

    const error = await useCase
      .execute({ code: 'svc123', establishmentCode: 'est123' })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when repository fails', async () => {
    serviceLoader.load.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ code: 'svc123', establishmentCode: 'est123' })
      .then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns service DTO when found', async () => {
    serviceLoader.load.mockResolvedValue(
      ok(
        Service.reconstruct({
          id: 'uuid-svc',
          code: 'svc123',
          name: 'Haircut',
          description: '',
          duration: 30,
          establishmentId: 'uuid-est',
          establishmentCode: 'est123',
        })
      )
    );

    const data = await useCase
      .execute({ code: 'svc123', establishmentCode: 'est123' })
      .then((r) => r.getData());

    expect(data).toEqual({
      id: 'svc123',
      name: 'Haircut',
      description: '',
      duration: 30,
      establishmentCode: 'est123',
    });
  });
});
