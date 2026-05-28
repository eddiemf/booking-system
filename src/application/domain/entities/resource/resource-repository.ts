import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Resource } from './resource-entity';

export interface ResourceRepository {
  save(resource: Resource): PromiseResult<Resource, StorageError | NotFoundError>;
  findAll(establishmentCode: string): PromiseResult<Resource[], StorageError>;
  findByIds(ids: string[], establishmentCode: string): PromiseResult<Resource[], StorageError>;
  findByCode(code: string): PromiseResult<Resource | null, StorageError>;
  update(code: string, resource: Resource): PromiseResult<Resource, StorageError | NotFoundError>;
  delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
