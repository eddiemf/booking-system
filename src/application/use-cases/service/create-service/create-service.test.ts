import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateService } from './create-service';

describe('CreateService', () => {
  const serviceRepository = mock<ServiceRepository>();

  const useCase = new CreateService(serviceRepository);

  const validInput = {
    name: 'Service',
    description: 'Test Service',
    duration: 60,
    establishmentId: '1',
  };

  it('returns a validation error if creating the entity returns a validation error', async () => {
    const resultError = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error if the establishment does not exist', async () => {
    serviceRepository.save.mockResolvedValue(fail(new NotFoundError('Establishment', '1')));

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(resultError).toBeInstanceOf(NotFoundError);
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    const error = new StorageError('Failed to save the entity');
    serviceRepository.save.mockResolvedValue(fail(error));

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(serviceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Service',
        description: 'Test Service',
        duration: 60,
        establishmentId: '1',
      })
    );
    expect(resultError).toBe(error);
  });

  it('returns a service DTO when creation was successful', async () => {
    serviceRepository.save.mockResolvedValue(
      ok(
        ServiceEntity.reconstruct({
          id: 'service-id',
          name: 'Service',
          description: 'Test Service',
          duration: 60,
          establishmentId: '1',
        })
      )
    );

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'service-id',
      name: 'Service',
      description: 'Test Service',
      duration: 60,
      establishmentId: '1',
    });
  });
});
