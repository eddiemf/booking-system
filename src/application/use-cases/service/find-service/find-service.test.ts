import { Service, type ServiceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { FindService } from './find-service';

describe('FindService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new FindService(serviceRepository);

  const establishmentCode = 'est123';
  const code = 'svc123';
  const mockService = Service.reconstruct({
    id: 'uuid-svc',
    code,
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ code, establishmentCode })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when lookup fails', async () => {
    serviceRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ code, establishmentCode })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns service DTO on success', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));

    const data = await useCase
      .execute({ code, establishmentCode })
      .then((result) => result.getData());

    expect(data).toEqual({
      id: code,
      name: 'Haircut',
      description: 'A haircut',
      duration: 30,
      establishmentCode: 'est123',
    });
  });
});
