import type { ResourceRepository } from '@app/domain/entities';
import type {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  StorageError,
} from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader } from '@app/loaders';
import { fail, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string; userId: string };

export class DeleteResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly resourceLoader: ResourceLoader,
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    code,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const resourceResult = await this.resourceLoader.load(code, establishmentCode);
    if (!resourceResult.isOk) return resourceResult;

    return this.resourceRepository.delete(code);
  }
}
