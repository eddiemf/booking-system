import type { ServiceRepository } from '@app/domain/entities';
import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string };

export class DeleteService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  execute({
    code,
    establishmentCode,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    return this.serviceRepository.delete(code, establishmentCode);
  }
}
