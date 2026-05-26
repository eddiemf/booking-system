import {
  type ResourceCreationError,
  ResourceEntity,
  type ResourceRepository,
  type ResourceType,
} from '@app/domain/entities';
import type { NotFoundError, StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
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
    const entityResult = ResourceEntity.create({ name, type, establishmentId: '' });
    if (!entityResult.isOk) return entityResult;

    const updateResult = await this.resourceRepository.update(code, entityResult.data);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(updateResult.data));
  }
}
