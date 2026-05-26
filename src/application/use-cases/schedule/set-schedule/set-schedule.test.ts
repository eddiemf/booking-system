import {
  ResourceEntity,
  type ResourceRepository,
  ScheduleEntity,
  type ScheduleRepository,
} from '@app/domain/entities';
import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SetSchedule } from './set-schedule';

describe('SetSchedule', () => {
  const resourceRepository = mock<ResourceRepository>();
  const scheduleRepository = mock<ScheduleRepository>();
  const useCase = new SetSchedule(resourceRepository, scheduleRepository);

  const resourceId = '10';
  const existingResource = ResourceEntity.reconstruct({
    id: resourceId,
    name: 'Alice',
    type: 'employee',
    establishmentId: '1',
  });

  const validEntries = [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }];

  const savedEntities = [
    ScheduleEntity.reconstruct({
      id: '1',
      resourceId,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    }),
  ];

  it('returns not-found error when resource does not exist', async () => {
    resourceRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ resourceId, entries: validEntries })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when findById fails', async () => {
    resourceRepository.findById.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ resourceId, entries: validEntries })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns validation error for invalid entry', async () => {
    resourceRepository.findById.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ resourceId, entries: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when replaceAll fails', async () => {
    resourceRepository.findById.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ resourceId, entries: validEntries })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns schedule DTOs on success', async () => {
    resourceRepository.findById.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok(savedEntities));

    const data = await useCase
      .execute({ resourceId, entries: validEntries })
      .then((result) => result.getData());

    expect(data).toEqual([
      { id: '1', resourceId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    ]);
  });

  it('returns empty array when entries is empty', async () => {
    resourceRepository.findById.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok([]));

    const data = await useCase
      .execute({ resourceId, entries: [] })
      .then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
