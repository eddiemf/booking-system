import {
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateResource } from './update-resource';

describe('UpdateResource', () => {
  const resourceRepository = mock<ResourceRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new UpdateResource(resourceRepository, establishmentRepository);

  const userId = 'uuid-user';
  const validInput = { code: 'res123', establishmentCode: 'est123', name: 'Room A', userId };
  const updatedEntity = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Room A',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = {
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  };

  it('returns validation error for empty name', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));

    const error = await useCase
      .execute({ ...validInput, establishmentCode: 'other-est' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    resourceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated resource DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    resourceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'res123',
      name: 'Room A',
      establishmentCode: 'est123',
    });
  });
});
