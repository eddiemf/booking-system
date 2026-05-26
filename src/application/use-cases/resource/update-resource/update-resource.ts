import {
  type ResourceCreationError,
  ResourceEntity,
  type ResourceRepository,
  type ResourceType,
} from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { code: string; name: string; type: ResourceType };

export class UpdateResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    code,
    name,
    type,
  }: Input): PromiseResult<ResourceDTO, ResourceCreationError | StorageError | NotFoundError> {
    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', code));

    const establishmentId = resourceResult.data.establishmentId;
    const editedResourceResult = ResourceEntity.create({ name, type, establishmentId });
    if (!editedResourceResult.isOk) return editedResourceResult;

    const editedResource = editedResourceResult.data;
    const updateResult = await this.resourceRepository.update(code, editedResource);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(updateResult.data));
  }
}
