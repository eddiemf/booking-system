import type { EstablishmentRepository, ResourceRepository } from '@app/domain/entities';
import {
  type ConflictError,
  ForbiddenError,
  NotFoundError,
  type StorageError,
} from '@app/domain/errors';
import { fail, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string; userId: string };

export class DeleteResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    code,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', code));
    if (resourceResult.data.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    return this.resourceRepository.delete(code);
  }
}
