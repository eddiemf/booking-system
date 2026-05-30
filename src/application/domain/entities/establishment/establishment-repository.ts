import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { Establishment } from './establishment-entity';

export interface EstablishmentRepository {
  get(limit: number, offset: number): PromiseResult<Establishment[], StorageError>;
  findByCode(code: string): PromiseResult<Establishment | null, StorageError>;
  save(establishment: Establishment): PromiseResult<void, StorageError>;
  update(
    code: string,
    establishment: Establishment
  ): PromiseResult<Establishment, StorageError | NotFoundError>;
  delete(code: string): PromiseResult<void, StorageError | NotFoundError | ConflictError>;
}
