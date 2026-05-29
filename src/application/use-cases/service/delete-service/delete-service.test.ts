import { Establishment, type ServiceRepository } from '@app/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { DeleteService } from './delete-service';

describe('DeleteService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const establishmentLoader = mock<EstablishmentLoader>();
  const useCase = new DeleteService(serviceRepository, establishmentLoader);

  const userId = 'uuid-user';
  const input = { code: 'svc123', establishmentCode: 'est123', userId };

  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
  });

  it('returns forbidden error when user is not the owner', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(
      fail(new ForbiddenError('You do not own this establishment.'))
    );

    const error = await useCase
      .execute({ ...input, userId: 'other-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('returns not-found error when service does not exist', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.delete.mockResolvedValue(fail(new NotFoundError('Service', 'svc123')));

    const error = await useCase.execute(input).then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns conflict error when service has future bookings', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.delete.mockResolvedValue(
      fail(new ConflictError('Service has future bookings.'))
    );

    const error = await useCase.execute(input).then((result) => result.getError());

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('returns storage error when delete fails', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.delete.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute(input).then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns ok on success', async () => {
    establishmentLoader.loadOwnedByUser.mockResolvedValue(ok(mockEstablishment));
    serviceRepository.delete.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
  });
});
