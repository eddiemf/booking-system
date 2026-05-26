import {
  EstablishmentEntity,
  type EstablishmentRepository,
  ServiceEntity,
} from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ListServices } from './list-services';

describe('ListServices', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new ListServices(establishmentRepository);

  const establishmentCode = 'est123';
  const mockService = ServiceEntity.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when establishment lookup fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ establishmentCode }).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns a list of service DTOs on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok(
        EstablishmentEntity.reconstruct({
          id: 'uuid-est',
          code: establishmentCode,
          name: 'Salon',
          services: [mockService],
        })
      )
    );

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
    establishmentRepository.findByCode.mockResolvedValue(
      ok(
        EstablishmentEntity.reconstruct({ id: 'uuid-est', code: establishmentCode, name: 'Salon' })
      )
    );

    const data = await useCase.execute({ establishmentCode }).then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
