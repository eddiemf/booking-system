import {
  EstablishmentEntity,
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateResource } from './create-resource';

describe('CreateResource', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new CreateResource(establishmentRepository, resourceRepository);

  const userId = 'uuid-user';
  const validInput = { name: 'Alice', establishmentCode: 'est123', userId };
  const savedEntity = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = EstablishmentEntity.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns validation error for empty name', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when establishment does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns storage error when save fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns resource DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));
    resourceRepository.save.mockResolvedValue(ok(savedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'res123',
      name: 'Alice',
      establishmentCode: 'est123',
    });
  });
});
