import {
  Establishment,
  Resource,
  type ResourceRepository,
  type ScheduleRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SetSchedule } from './set-schedule';

describe('SetSchedule', () => {
  const resourceRepository = mock<ResourceRepository>();
  const scheduleRepository = mock<ScheduleRepository>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const resourceLoader = mock<ResourceLoader>();
  const useCase = new SetSchedule(
    resourceRepository,
    scheduleRepository,
    establishmentLoader,
    resourceLoader
  );

  const userId = 'uuid-user';
  const resourceCode = 'res123';
  const existingResource = Resource.reconstruct({
    id: 'uuid-res',
    code: resourceCode,
    name: 'Alice',
    establishmentId: 'uuid-est',
    establishmentCode: 'est123',
  });

  const validEntries = [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }];

  const establishmentCode = 'est123';
  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: establishmentCode,
    name: 'Salon',
    userId,
  });

  const validInput = { resourceCode, establishmentCode, entries: validEntries, userId };

  it('returns forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const error = await useCase
      .execute({ ...validInput, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when resource does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(fail(new NotFoundError('Resource', resourceCode)));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when findByCode fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns validation error for invalid entry', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingResource));

    const error = await useCase
      .execute({ ...validInput, entries: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ValidationError);
  });

  it('returns storage error when replaceAll fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(validInput).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns schedule DTOs on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok(undefined));

    const data = await useCase.execute(validInput).then((result) => result.getData());

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      resourceId: 'uuid-res',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    });
  });

  it('returns empty array when entries is empty', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    resourceLoader.load.mockResolvedValue(ok(existingResource));
    scheduleRepository.replaceAll.mockResolvedValue(ok(undefined));

    const data = await useCase
      .execute({ ...validInput, entries: [] })
      .then((result) => result.getData());

    expect(data).toEqual([]);
  });
});
