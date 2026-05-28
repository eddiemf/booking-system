import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ResourceEntity } from './resource-entity';

export interface ResourceRepository {
  save(resource: ResourceEntity): PromiseResult<ResourceEntity, StorageError | NotFoundError>;
  findAll(establishmentCode: string): PromiseResult<ResourceEntity[], StorageError>;
  findByIds(
    ids: string[],
    establishmentCode: string
  ): PromiseResult<ResourceEntity[], StorageError>;
  findByCode(code: string): PromiseResult<ResourceEntity | null, StorageError>;
  update(
    code: string,
    resource: ResourceEntity
  ): PromiseResult<ResourceEntity, StorageError | NotFoundError>;
  delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
