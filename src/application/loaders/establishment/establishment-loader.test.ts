import { Establishment, type EstablishmentRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { EstablishmentLoader } from './establishment-loader';

describe('EstablishmentLoader', () => {
  const establishmentRepository = mock<EstablishmentRepository>();
  const loader = new EstablishmentLoader(establishmentRepository);

  const userId = 'uuid-user';
  const mockEstablishment = Establishment.reconstruct({
    id: 'uuid-est',
    code: 'est123',
    name: 'Salon',
    userId,
    timezone: 'UTC',
  });

  describe('load()', () => {
    it('returns establishment when found', async () => {
      establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

      const data = await loader.load('est123').then((r) => r.getData());

      expect(data).toBe(mockEstablishment);
    });

    it('returns not-found error when establishment does not exist', async () => {
      establishmentRepository.findByCode.mockResolvedValue(ok(null));

      const error = await loader.load('est123').then((r) => r.getError());

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('forwards storage error', async () => {
      establishmentRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

      const error = await loader.load('est123').then((r) => r.getError());

      expect(error).toBeInstanceOf(StorageError);
    });
  });

  describe('loadOwnedByUser()', () => {
    it('returns establishment when owned by user', async () => {
      establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

      const data = await loader.loadOwnedByUser('est123', userId).then((r) => r.getData());

      expect(data).toBe(mockEstablishment);
    });

    it('returns not-found error when establishment does not exist', async () => {
      establishmentRepository.findByCode.mockResolvedValue(ok(null));

      const error = await loader.loadOwnedByUser('est123', userId).then((r) => r.getError());

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('returns forbidden error when user is not the owner', async () => {
      establishmentRepository.findByCode.mockResolvedValue(ok(mockEstablishment));

      const error = await loader.loadOwnedByUser('est123', 'other-user').then((r) => r.getError());

      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('forwards storage error', async () => {
      establishmentRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

      const error = await loader.loadOwnedByUser('est123', userId).then((r) => r.getError());

      expect(error).toBeInstanceOf(StorageError);
    });
  });
});
