import { Service, type ServiceRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ServiceLoader } from './service-loader';

describe('ServiceLoader', () => {
  const serviceRepository = mock<ServiceRepository>();
  const loader = new ServiceLoader(serviceRepository);

  const establishmentCode = 'est123';
  const mockService = Service.reconstruct({
    id: 'uuid-svc',
    code: 'svc123',
    name: 'Haircut',
    description: '',
    duration: 30,
    establishmentId: 'uuid-est',
    establishmentCode,
  });

  it('returns service when found', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(mockService));

    const data = await loader.load('svc123', 'est123').then((r) => r.getData());

    expect(data).toBe(mockService);
  });

  it('returns not-found error when service does not exist', async () => {
    serviceRepository.findByCode.mockResolvedValue(ok(null));

    const error = await loader.load('svc123', 'est123').then((r) => r.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('forwards storage error', async () => {
    serviceRepository.findByCode.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await loader.load('svc123', 'est123').then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});
