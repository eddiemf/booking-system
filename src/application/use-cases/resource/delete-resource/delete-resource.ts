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
    const [establishmentResult, resourceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.resourceRepository.findByCode(code),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!resourceResult.isOk) return resourceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', code));
    if (resource.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    return this.resourceRepository.delete(code);
  }
}
