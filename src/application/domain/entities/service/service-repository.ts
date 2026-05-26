import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ServiceEntity } from './service-entity';

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError | NotFoundError>;
  findAll(establishmentCode: string): PromiseResult<ServiceEntity[], StorageError>;
  findByCode(
    code: string,
    establishmentCode: string
  ): PromiseResult<ServiceEntity | null, StorageError>;
  update(
    code: string,
    establishmentCode: string,
    service: ServiceEntity
  ): PromiseResult<ServiceEntity, StorageError | NotFoundError>;
  delete(
    code: string,
    establishmentCode: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
