import type { ServiceRepository } from '@app/domain/entities';
import type {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  StorageError,
} from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import type { PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string; userId: string };

export class DeleteService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    code,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const result = await this.establishmentLoader.loadOwnedByUser(establishmentCode, userId);
    if (!result.isOk) return result;

    return this.serviceRepository.delete(code, establishmentCode);
  }
}
