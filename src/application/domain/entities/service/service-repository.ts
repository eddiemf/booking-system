import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Service } from './service-entity';

export interface ServiceRepository {
  save(service: Service): PromiseResult<void, StorageError | NotFoundError>;
  get(establishmentCode: string): PromiseResult<Service[], StorageError>;
  findByCode(code: string, establishmentCode: string): PromiseResult<Service | null, StorageError>;
  update(
    code: string,
    establishmentCode: string,
    service: Service
  ): PromiseResult<void, StorageError | NotFoundError>;
  delete(
    code: string,
    establishmentCode: string
  ): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
