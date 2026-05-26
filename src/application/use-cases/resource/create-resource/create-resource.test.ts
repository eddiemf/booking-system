import {
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { CreateResource } from './create-resource';

describe('CreateResource', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const resourceRepository = mock<ResourceRepository>();
  const useCase = new CreateResource(establishmentRepository, resourceRepository);

  const validInput = { name: 'Alice', type: 'employee' as const, establishmentCode: 'est123' };
  const savedEntity = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: 'res123',
    name: 'Alice',
    type: 'employee',
    establishmentId: 'uuid-est',
  });

  it('returns validation error for empty name', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: 'est123', name: 'Salon' } as never)
    );

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

  it('returns storage error when save fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: 'est123', name: 'Salon' } as never)
    );
    resourceRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns resource DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(
      ok({ id: 'uuid-est', code: 'est123', name: 'Salon' } as never)
    );
    resourceRepository.save.mockResolvedValue(ok(savedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'res123',
      name: 'Alice',
      type: 'employee',
      establishmentId: 'uuid-est',
    });
  });
});
