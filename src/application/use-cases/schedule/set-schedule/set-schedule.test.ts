import {
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
  ScheduleEntity,
  type ScheduleRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SetSchedule } from './set-schedule';

describe('SetSchedule', () => {
  const resourceRepository = mock<ResourceRepository>();
  const scheduleRepository = mock<ScheduleRepository>();
  const establishmentRepository = mock<EstablishmentRepository>();
  const useCase = new SetSchedule(resourceRepository, scheduleRepository, establishmentRepository);

  const userId = 'uuid-user';
  const resourceCode = 'res123';
  const existingResource = ResourceEntity.reconstruct({
    id: 'uuid-res',
    code: resourceCode,
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const validEntries = [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }];

  const savedEntities = [
    ScheduleEntity.reconstruct({
      id: '1',
      code: 'sch1',
      resourceId: 'uuid-res',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    }),
  ];

  const establishmentCode = 'est123';
  const mockEstablishment = {
    id: 'uuid-est',
    code: establishmentCode,
    name: 'Salon',
    userId,
  };

  const validInput = { resourceCode, establishmentCode, entries: validEntries, userId };

  it('returns forbidden error when user is not the owner', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns not-found error when resource belongs to another establishment', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ ...validInput, establishmentCode: 'other-est' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when findByCode fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns validation error for invalid entry', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ ...validInput, entries: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when replaceAll fails', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns schedule DTOs on success', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok(savedEntities));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toEqual([
      { id: 'sch1', resourceId: 'uuid-res', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    ]);
  });

  it('returns empty array when entries is empty', async () => {
    establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment as never));
    resourceRepository.findByCode.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok([]));

    const data = await useCase
      .execute({ ...validInput, entries: [] })
      .then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
