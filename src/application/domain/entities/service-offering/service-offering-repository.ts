import type { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { ServiceOfferingEntity } from './service-offering-entity';

export interface ServiceOfferingRepository {
  assign(
    serviceOffering: ServiceOfferingEntity
  ): PromiseResult<ServiceOfferingEntity, StorageError | NotFoundError | ConflictError>;
  unassign(
    serviceId: string,
    resourceId: string
  ): PromiseResult<void, StorageError | NotFoundError>;
  findByServiceCode(
    serviceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOfferingEntity[], StorageError>;
  findByResourceCode(
    resourceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOfferingEntity[], StorageError>;
}
