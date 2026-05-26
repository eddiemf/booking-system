import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { EstablishmentEntity } from './establishment-entity';

export interface EstablishmentRepository {
  findByCode(code: string): PromiseResult<EstablishmentEntity | null, StorageError>;
  save(establishment: EstablishmentEntity): PromiseResult<EstablishmentEntity, StorageError>;
  update(
    code: string,
    establishment: EstablishmentEntity
  ): PromiseResult<EstablishmentEntity, StorageError | NotFoundError>;
  delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
