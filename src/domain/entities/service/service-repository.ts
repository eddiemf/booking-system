import { PromiseResult } from '@shared/result';
import { ServiceEntity } from './service-entity';
import { StorageError } from '@domain/errors';

export const ServiceRepositoryId = Symbol.for('ServiceRepository');

export interface ServiceRepository {
  save(service: ServiceEntity): PromiseResult<void, StorageError>;
}
