import type { ServiceOffering, ServiceOfferingRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryServiceOfferingRepository implements ServiceOfferingRepository {
  private offerings = new Map<string, ServiceOffering>();
  private _serviceCodeToIds = new Map<string, Set<string>>(); // serviceCode → Set<serviceId>

  clear() {
    this.offerings.clear();
    this._serviceCodeToIds.clear();
  }

  async assign(
    serviceOffering: ServiceOffering,
    serviceCode?: string
  ): PromiseResult<ServiceOffering, StorageError | NotFoundError | ConflictError> {
    const existing = [...this.offerings.values()].find(
      (o) =>
        o.serviceId === serviceOffering.serviceId && o.resourceId === serviceOffering.resourceId
    );
    if (existing) {
      return fail(new ConflictError('Resource is already assigned to this service.'));
    }

    this.offerings.set(serviceOffering.id, serviceOffering);

    if (serviceCode) {
      const existingCodeEntry = this._serviceCodeToIds.get(serviceCode);
      if (existingCodeEntry) {
        existingCodeEntry.add(serviceOffering.serviceId);
      } else {
        this._serviceCodeToIds.set(serviceCode, new Set([serviceOffering.serviceId]));
      }
    }

    return ok(serviceOffering);
  }

  async unassign(
    serviceId: string,
    resourceId: string
  ): PromiseResult<void, StorageError | NotFoundError> {
    const entry = [...this.offerings.values()].find(
      (o) => o.serviceId === serviceId && o.resourceId === resourceId
    );
    if (!entry) {
      return fail(new NotFoundError('ServiceOffering', `${serviceId}:${resourceId}`));
    }

    this.offerings.delete(entry.id);
    return ok(undefined);
  }

  async getByServiceCode(
    serviceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOffering[], StorageError> {
    const serviceIds = this._serviceCodeToIds.get(serviceCode);
    if (!serviceIds) return ok([]);

    const result = [...this.offerings.values()].filter((o) => serviceIds.has(o.serviceId));
    return ok(result);
  }

  async getByResourceCode(
    resourceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOffering[], StorageError> {
    return ok([...this.offerings.values()].filter((o) => o.resourceId === resourceCode));
  }
}
