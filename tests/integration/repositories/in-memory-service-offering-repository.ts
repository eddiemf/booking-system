import type { ServiceOffering, ServiceOfferingRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryServiceOfferingRepository implements ServiceOfferingRepository {
  private offerings = new Map<string, ServiceOffering>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this.offerings.clear();
    this._lastError = undefined;
  }

  async assign(
    serviceOffering: ServiceOffering
  ): PromiseResult<ServiceOffering, StorageError | NotFoundError | ConflictError> {
    if (this._lastError) return fail(this._lastError);

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
    if (this._lastError) return fail(this._lastError);

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
    if (this._lastError) return fail(this._lastError);
    // In tests, we store offerings by serviceId but query by serviceCode.
    // The in-memory repo doesn't have access to the service repo to map code→id,
    // so we return all offerings. Tests should use serviceId directly.
    return ok([...this.offerings.values()]);
  }

  async getByResourceCode(
    resourceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOffering[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    return ok([...this.offerings.values()].filter((o) => o.resourceId === resourceCode));
  }
}
