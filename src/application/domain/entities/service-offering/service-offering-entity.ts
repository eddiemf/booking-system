import type { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import { Duration } from '../service/duration/duration';
import { Capacity } from './capacity/capacity';
import { Price } from './price/price';

export type ServiceOfferingCreationError = ValidationError;

export class ServiceOffering {
  private constructor(
    private _id: string,
    private _code: string,
    private _serviceId: string,
    private _resourceId: string,
    private _maxCapacity: Capacity,
    private _durationMinutes: Duration,
    private _slotIntervalMinutes: Duration,
    private _price: Price
  ) {}

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get resourceId(): string {
    return this._resourceId;
  }

  get maxCapacity(): Capacity {
    return this._maxCapacity;
  }

  get durationMinutes(): Duration {
    return this._durationMinutes;
  }

  get slotIntervalMinutes(): Duration {
    return this._slotIntervalMinutes;
  }

  get price(): Price {
    return this._price;
  }

  static create(props: {
    serviceId: string;
    resourceId: string;
    maxCapacity?: number | undefined;
    durationMinutes: number;
    slotIntervalMinutes: number;
    price?: number | undefined;
  }): Result<ServiceOffering, ServiceOfferingCreationError> {
    const capacityResult = Capacity.create(props.maxCapacity ?? 1, 'maxCapacity');
    if (!capacityResult.isOk) return capacityResult;

    const durationResult = Duration.create(props.durationMinutes, 'durationMinutes');
    if (!durationResult.isOk) return durationResult;

    const intervalResult = Duration.create(props.slotIntervalMinutes, 'slotIntervalMinutes');
    if (!intervalResult.isOk) return intervalResult;

    const priceResult = Price.create(props.price ?? 0, 'price');
    if (!priceResult.isOk) return priceResult;

    return ok(
      new ServiceOffering(
        EntityId.generate(),
        EntityCode.generate(),
        props.serviceId,
        props.resourceId,
        capacityResult.data,
        durationResult.data,
        intervalResult.data,
        priceResult.data
      )
    );
  }

  static reconstruct(props: {
    id: string;
    code: string;
    serviceId: string;
    resourceId: string;
    maxCapacity: number;
    durationMinutes: number;
    slotIntervalMinutes: number;
    price: number;
  }): ServiceOffering {
    return new ServiceOffering(
      props.id,
      props.code,
      props.serviceId,
      props.resourceId,
      Capacity.from(props.maxCapacity),
      Duration.from(props.durationMinutes),
      Duration.from(props.slotIntervalMinutes),
      Price.from(props.price)
    );
  }
}
