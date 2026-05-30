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

  /**
   * Register a mapping between a service code and a service ID.
   * Must be called before getByServiceCode() can find offerings by service code.
   * This is separate from assign() to keep the interface clean — assign() only
   * takes the entity, while code mappings are established explicitly in seed code.
   */
  registerServiceCodeMapping(serviceId: string, serviceCode: string): void {
    const existingCodeEntry = this._serviceCodeToIds.get(serviceCode);
    if (existingCodeEntry) {
      existingCodeEntry.add(serviceId);
    } else {
      this._serviceCodeToIds.set(serviceCode, new Set([serviceId]));
    }
  }

  async assign(
    serviceOffering: ServiceOffering
  ): PromiseResult<ServiceOffering, StorageError | NotFoundError | ConflictError> {
    const existing = [...this.offerings.values()].find(
      (o) =>
        o.serviceId === serviceOffering.serviceId && o.resourceId === serviceOffering.resourceId
    );
    if (existing) {
      return fail(new ConflictError('Resource is already assigned to this service.'));
    }

    this.offerings.set(serviceOffering.id, serviceOffering);

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
