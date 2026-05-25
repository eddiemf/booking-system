import {
  type EstablishmentRepository,
  ServiceEntity,
  type ServiceRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListServices } from './list-services';

describe('ListServices', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new ListServices(establishmentRepository, serviceRepository);

  const establishmentId = '1';
  const mockService = ServiceEntity.reconstruct({
    id: '10',
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentId,
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase.execute({ establishmentId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when establishment lookup fails', async () => {
    establishmentRepository.findById.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns storage error when service listing fails', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    serviceRepository.findAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentId }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns a list of service DTOs on success', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    serviceRepository.findAll.mockResolvedValue(ok([mockService]));

    const data = await useCase.execute({ establishmentId }).then((r) => r.getData());

    expect(data).toEqual([
      {
        id: '10',
        name: 'Haircut',
        description: 'A haircut',
        duration: 30,
        establishmentId,
      },
    ]);
  });

  it('returns an empty array when establishment has no services', async () => {
    establishmentRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Salon' } as never));
    serviceRepository.findAll.mockResolvedValue(ok([]));

    const data = await useCase.execute({ establishmentId }).then((r) => r.getData());

    expect(data).toEqual([]);
  });
});
