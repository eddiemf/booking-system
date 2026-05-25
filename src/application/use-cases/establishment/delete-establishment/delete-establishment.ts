import type { EstablishmentRepository } from '@app/domain/entities';
import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';

type Input = {
  id: string;
};

export class DeleteEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  execute({ id }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    return this.establishmentRepository.delete(id);
  }
}
