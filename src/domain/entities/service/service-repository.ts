import type { StorageError } from '@domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ServiceEntity } from './service-entity';

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<void, StorageError>;
}
