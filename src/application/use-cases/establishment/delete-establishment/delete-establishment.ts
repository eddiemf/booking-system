import type { EstablishmentRepository } from '@app/domain/entities';
import type {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  StorageError,
} from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import type { PromiseResult } from '@shared/result';

interface Input {
  code: string;
  userId: string;
}

export class DeleteEstablishment {
  constructor(
    private readonly establishmentLoader: EstablishmentLoader,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    code,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const result = await this.establishmentLoader.loadOwnedByUser(code, userId);
    if (!result.isOk) return result;

    return this.establishmentRepository.delete(code);
  }
}
