import type { StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { EstablishmentEntity } from './establishment-entity';

export interface EstablishmentRepository {
  save(establishment: EstablishmentEntity): PromiseResult<EstablishmentEntity, StorageError>;
}
