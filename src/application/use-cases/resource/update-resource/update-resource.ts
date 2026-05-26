import type { ResourceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError, type ValidationError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { code: string; name: string };

export class UpdateResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    code,
    name,
  }: Input): PromiseResult<ResourceDTO, ValidationError | StorageError | NotFoundError> {
    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', code));

    const resource = resourceResult.data;
    const editedResourceResult = resource.update({ name });
    if (!editedResourceResult.isOk) return editedResourceResult;

    const editedResource = editedResourceResult.data;
    const updateResult = await this.resourceRepository.update(code, editedResource);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(updateResult.data));
  }
}
