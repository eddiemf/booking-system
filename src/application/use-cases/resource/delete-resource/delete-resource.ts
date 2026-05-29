import type { ResourceRepository } from '@app/domain/entities';
import {
  type ConflictError,
  type ForbiddenError,
  NotFoundError,
  type StorageError,
} from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string; userId: string };

export class DeleteResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
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

    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', code));

    if (resource.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    return this.resourceRepository.delete(code);
  }
}
