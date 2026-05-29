import { Establishment, type ServiceRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateService } from './create-service';

describe('CreateService', () => {
  const establishmentLoader = mock<EstablishmentLoader>();
  const serviceRepository = mock<ServiceRepository>();

  const useCase = new CreateService(establishmentLoader, serviceRepository);

  const userId = 'uuid-user';
  const validInput = {
    name: 'Service',
    description: 'Test Service',
    duration: 60,
    establishmentCode: 'est123',
    userId,
  };

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-1',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns a validation error if creating the entity returns a validation error', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));

    const resultError = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ValidationError);
  });

  it('returns a not-found error if the establishment does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new NotFoundError('Establishment', 'est123'))
    );

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(resultError).toBeInstanceOf(NotFoundError);
  });

  it('returns a forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const resultError = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(resultError).toBeInstanceOf(ForbiddenError);
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    const error = new StorageError('Failed to save the entity');
    serviceRepository.save.mockResolvedValue(fail(error));

    const resultError = await useCase.execute(validInput).then((result) => result.getError());

    expect(resultError).toBe(error);
  });

  it('returns a service DTO when creation was successful', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.save.mockResolvedValue(ok(undefined));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toMatchObject({
      name: 'Service',
      description: 'Test Service',
      duration: 60,
      establishmentCode: 'est123',
    });
    expect(typeof data.id).toBe('string');
  });
});
