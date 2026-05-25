import type { StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ServiceEntity } from './service-entity';

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<ServiceEntity, StorageError>;
}
