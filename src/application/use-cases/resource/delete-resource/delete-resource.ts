import type { ResourceRepository } from '@app/domain/entities';
import { type ConflictError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string };

export class DeleteResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    code,
    establishmentCode,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError> {
    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', code));
    if (resourceResult.data.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    return this.resourceRepository.delete(code);
  }
}
