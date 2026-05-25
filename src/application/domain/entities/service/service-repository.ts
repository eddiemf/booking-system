import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ServiceEntity } from './service-entity';

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError | NotFoundError>;
  findAll(establishmentId: string): PromiseResult<ServiceEntity[], StorageError>;
  findById(id: string, establishmentId: string): PromiseResult<ServiceEntity | null, StorageError>;
  update(
    id: string,
    establishmentId: string,
    service: ServiceEntity
  ): PromiseResult<ServiceEntity, StorageError | NotFoundError>;
  delete(
    id: string,
    establishmentId: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
