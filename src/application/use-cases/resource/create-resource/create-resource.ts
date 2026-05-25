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

type Input = {
  name: string;
  type: ResourceType;
  establishmentId: string;
};

export class CreateResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    name,
    type,
    establishmentId,
  }: Input): PromiseResult<ResourceDTO, ResourceCreationError | StorageError | NotFoundError> {
    const entityResult = ResourceEntity.create({ name, type, establishmentId });
    if (!entityResult.isOk) return entityResult;

    const saveResult = await this.resourceRepository.save(entityResult.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ResourceMapper.toDTO(saveResult.data));
  }
}
