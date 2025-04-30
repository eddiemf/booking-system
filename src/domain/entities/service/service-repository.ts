import { PromiseResult } from '@shared/result';
import { ServiceEntity } from './service-entity';
import { StorageError } from '@domain/errors';

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<void, StorageError>;
}
