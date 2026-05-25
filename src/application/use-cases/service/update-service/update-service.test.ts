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
    id: '10',
    establishmentId: '1',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
  };

  const updatedEntity = ServiceEntity.reconstruct({
    id: '10',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    establishmentId: '1',
  });

  it('returns validation error for invalid name', async () => {
    const error = await useCase.execute({ ...validInput, name: '' }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns validation error for invalid duration', async () => {
    const error = await useCase.execute({ ...validInput, duration: 0 }).then((r) => r.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.update.mockResolvedValue(fail(new NotFoundError('Service', '10')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    serviceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated service DTO on success', async () => {
    serviceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((r) => r.getData());

    expect(data).toEqual({
      id: '10',
      name: 'Haircut',
      description: 'Updated',
      duration: 45,
      establishmentId: '1',
    });
  });
});
