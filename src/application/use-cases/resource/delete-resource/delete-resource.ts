import type { ResourceRepository } from '@app/domain/entities';
import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';

type Input = { code: string };

export class DeleteResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  execute({ code }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    return this.resourceRepository.delete(code);
  }
}
