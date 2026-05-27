import {
  type EstablishmentRepository,
  ServiceEntity,
  type ServiceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { UpdateService } from './update-service';

describe('UpdateService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new UpdateService(serviceRepository, establishmentRepository);

  const userId = 'uuid-user';
  const validInput = {
    code: 'svc123',
    establishmentCode: 'est123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    userId,
  };

  const updatedEntity = ServiceEntity.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: 'Updated',
    duration: 45,
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const mockEstablishment = {
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  };

  it('returns validation error for invalid name', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    serviceRepository.findByCode.mockResolvedValue(ok(updatedEntity));

    const error = await useCase
      .execute({ ...validInput, name: '' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns validation error for invalid duration', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    serviceRepository.findByCode.mockResolvedValue(ok(updatedEntity));

    const error = await useCase
      .execute({ ...validInput, duration: 0 })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when service does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when update fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    serviceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    serviceRepository.update.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns updated service DTO on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    serviceRepository.findByCode.mockResolvedValue(ok(updatedEntity));
    serviceRepository.update.mockResolvedValue(ok(updatedEntity));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual({
      id: 'svc123',
      name: 'Haircut',
      description: 'Updated',
      duration: 45,
      establishmentCode: 'est123',
    });
  });
});
