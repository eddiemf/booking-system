import type { Resource, ResourceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class ResourceLoader {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async load(
    code: string,
    establishmentCode: string
  ): PromiseResult<Resource, StorageError | NotFoundError> {
    const result = await this.resourceRepository.findByCode(code);
    if (!result.isOk) return result;

    const resource = result.data;
    if (!resource) return fail(new NotFoundError('Resource', code));
    if (resource.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', code));
    }

    return ok(resource);
  }
}
