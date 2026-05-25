import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ResourceEntity, ResourceType } from './resource-entity';

export interface ResourceRepository {
  save(resource: ResourceEntity): PromiseResult<ResourceEntity, StorageError | NotFoundError>;
  findAll(
    establishmentId: string,
    type?: ResourceType
  ): PromiseResult<ResourceEntity[], StorageError>;
  findById(id: string): PromiseResult<ResourceEntity | null, StorageError>;
  update(
    id: string,
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError>;
  delete(id: string): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
