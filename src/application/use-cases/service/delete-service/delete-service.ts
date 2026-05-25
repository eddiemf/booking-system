import type { ServiceRepository } from '@app/domain/entities';
import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';

type Input = { id: string; establishmentId: string };

export class DeleteService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    id,
    establishmentId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    return this.serviceRepository.delete(id, establishmentId);
  }
}
