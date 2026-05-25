import type { ServiceRepository } from '@app/domain/entities';
import { StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { mock } from 'jest-mock-extended';
import { CreateService } from './create-service';

describe('CreateService', () => {
  const serviceRepository = mock<ServiceRepository>();

  const useCase = new CreateService(serviceRepository);

  it('returns a validation error if creating the entity returns a validation error', async () => {
    const resultError = await useCase
      .execute({
        name: '',
        description: 'Test Service',
        duration: 60,
      })
      .then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ValidationError);
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    const error = new StorageError('Failed to save the entity');
    serviceRepository.save.mockResolvedValue(fail(error));

    const resultError = await useCase
      .execute({
        name: 'Service',
        description: 'Test Service',
        duration: 60,
      })
      .then((result) => result.getError());

    expect(serviceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Service',
        description: 'Test Service',
        duration: 60,
      })
    );
    expect(resultError).toBe(error);
  });

  it('returns a service DTO when creation was successful', async () => {
    serviceRepository.save.mockResolvedValue(ok(undefined));

    const data = await useCase
      .execute({
        name: 'Service',
        description: 'Test Service',
        duration: 60,
      })
      .then((result) => result.getData());

    expect(data).toEqual({
      id: expect.any(String),
      name: 'Service',
      description: 'Test Service',
      duration: 60,
    });
  });
});
