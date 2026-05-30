import type { ServiceRepository } from '@app/domain/entities';
import { Service } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListServices } from './list-services';

describe('ListServices', () => {
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new ListServices(serviceRepository);

  const establishmentCode = 'est123';
  const mockService = Service.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns storage error when repository fails', async () => {
    serviceRepository.get.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns a list of service DTOs on success', async () => {
    serviceRepository.get.mockResolvedValue(ok([mockService]));

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([
      {
        id: 'svc123',
        name: 'Haircut',
        description: 'A haircut',
        duration: 30,
        establishmentCode: 'est123',
      },
    ]);
  });

  it('returns an empty array when establishment has no services', async () => {
    serviceRepository.get.mockResolvedValue(ok([]));

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
