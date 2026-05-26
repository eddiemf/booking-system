import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateService } from './update-service';

describe('UpdateService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new UpdateService(serviceRepository);

  const validInput = {
    code: 'svc123',
    establishmentCode: 'est123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
  };

  const updatedEntity = ServiceEntity.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    establishmentId: 'uuid-est',
  });

  it('returns validation error for invalid name', async () => {
    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns validation error for invalid duration', async () => {
    const error = await useCase
      .execute({ ...validInput, duration: 0 })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.update.mockResolvedValue(fail(new NotFoundError('Service', 'svc123')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    serviceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated service DTO on success', async () => {
    serviceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'svc123',
      name: 'Haircut',
      description: 'Updated',
      duration: 45,
      establishmentId: 'uuid-est',
    });
  });
});
