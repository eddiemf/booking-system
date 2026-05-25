import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { FindService } from './find-service';

describe('FindService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new FindService(serviceRepository);

  const establishmentId = '1';
  const id = '10';
  const mockService = ServiceEntity.reconstruct({
    id,
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentId,
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase.execute({ id, establishmentId }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when lookup fails', async () => {
    serviceRepository.findById.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ id, establishmentId }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns service DTO on success', async () => {
    serviceRepository.findById.mockResolvedValue(ok(mockService));

    const data = await useCase.execute({ id, establishmentId }).then((result) => result.getData());

    expect(data).toEqual({
      id,
      name: 'Haircut',
      description: 'A haircut',
      duration: 30,
      establishmentId,
    });
  });
});
