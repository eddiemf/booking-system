import type { ServiceRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteService } from './delete-service';

describe('DeleteService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const useCase = new DeleteService(serviceRepository);

  const input = { id: '10', establishmentId: '1' };

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.delete.mockResolvedValue(fail(new NotFoundError('Service', '10')));

    const error = await useCase.execute(input).then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when service has future bookings', async () => {
    serviceRepository.delete.mockResolvedValue(
      fail(new ConflictError('Service has future bookings.'))
    );

    const error = await useCase.execute(input).then((r) => r.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when delete fails', async () => {
    serviceRepository.delete.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(input).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    serviceRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
  });
});
