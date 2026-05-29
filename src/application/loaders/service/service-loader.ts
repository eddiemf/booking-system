import type { Service, ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class ServiceLoader {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async load(
    code: string,
    establishmentCode: string
  ): PromiseResult<Service, StorageError | NotFoundError> {
    const result = await this.serviceRepository.findByCode(code, establishmentCode);
    if (!result.isOk) return result;

    const service = result.data;
    if (!service) return fail(new NotFoundError('Service', code));

    return ok(service);
  }
}
