import type { StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { EstablishmentEntity } from './establishment-entity';

export interface EstablishmentRepository {
  findById(id: string): PromiseResult<EstablishmentEntity | null, StorageError>;
  save(establishment: EstablishmentEntity): PromiseResult<EstablishmentEntity, StorageError>;
}
