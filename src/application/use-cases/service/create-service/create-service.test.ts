import {
  type EstablishmentRepository,
  ServiceEntity,
  type ServiceRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateService } from './create-service';

describe('CreateService', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const serviceRepository = mock<ServiceRepository>();

  const useCase = new CreateService(establishmentRepository, serviceRepository);

  const validInput = {
    name: 'Service',
    description: 'Test Service',
    duration: 60,
    establishmentCode: 'est123',
  };

  it('returns a validation error if creating the entity returns a validation error', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-1', code: 'est123', name: 'Salon' } as never)
    );

    const resultError = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error if the establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(resultError).toBeInstanceOf(NotFoundError);
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-1', code: 'est123', name: 'Salon' } as never)
    );
    const error = new StorageError('Failed to save the entity');
    serviceRepository.save.mockResolvedValue(fail(error));

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(resultError).toBe(error);
  });

  it('returns a service DTO when creation was successful', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-1', code: 'est123', name: 'Salon' } as never)
    );
    serviceRepository.save.mockResolvedValue(
      ok(
        ServiceEntity.reconstruct({
          id: 'uuid-svc',
          code: 'svc123',
          name: 'Service',
          description: 'Test Service',
          duration: 60,
          establishmentId: 'uuid-1',
        })
      )
    );

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'svc123',
      name: 'Service',
      description: 'Test Service',
      duration: 60,
      establishmentId: 'uuid-1',
    });
  });
});
