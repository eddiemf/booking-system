import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';

export type BookingCreationError = ValidationError;

export type BookingStatus = 'confirmed' | 'cancelled';

interface Props {
  customerId: string;
  customerCode: string;
  customerName: string;
  establishmentId: string;
  establishmentCode: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  startsAt: string;
  endsAt: string;
  servicePrice: number;
  serviceDuration: number;
}

interface ReconstructProps {
  id: string;
  code: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  establishmentId: string;
  establishmentCode: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  servicePrice: number;
  serviceDuration: number;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export class BookingEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _customerId: string,
    private _customerCode: string,
    private _customerName: string,
    private _establishmentId: string,
    private _establishmentCode: string,
    private _serviceId: string,
    private _serviceCode: string,
    private _serviceName: string,
    private _resourceId: string,
    private _resourceCode: string,
    private _resourceName: string,
    private _startsAt: string,
    private _endsAt: string,
    private _status: BookingStatus,
    private _servicePrice: number,
    private _serviceDuration: number
  ) {}

  get id(): string {
    return this._id;
  }
  get code(): string {
    return this._code;
  }
  get customerId(): string {
    return this._customerId;
  }
  get customerCode(): string {
    return this._customerCode;
  }
  get customerName(): string {
    return this._customerName;
  }
  get establishmentId(): string {
    return this._establishmentId;
  }
  get establishmentCode(): string {
    return this._establishmentCode;
  }
  get serviceId(): string {
    return this._serviceId;
  }
  get serviceCode(): string {
    return this._serviceCode;
  }
  get serviceName(): string {
    return this._serviceName;
  }
  get resourceId(): string {
    return this._resourceId;
  }
  get resourceCode(): string {
    return this._resourceCode;
  }
  get resourceName(): string {
    return this._resourceName;
  }
  get startsAt(): string {
    return this._startsAt;
  }
  get endsAt(): string {
    return this._endsAt;
  }
  get status(): BookingStatus {
    return this._status;
  }
  get servicePrice(): number {
    return this._servicePrice;
  }
  get serviceDuration(): number {
    return this._serviceDuration;
  }

  static create(props: Props): Result<BookingEntity, BookingCreationError> {
    const startsAtError = BookingEntity.validateDateTime(props.startsAt, 'startsAt');
    if (startsAtError) return fail(startsAtError);

    const endsAtError = BookingEntity.validateDateTime(props.endsAt, 'endsAt');
    if (endsAtError) return fail(endsAtError);

    if (new Date(props.endsAt) <= new Date(props.startsAt)) {
      return fail(new ValidationError('endsAt', 'Must be after startsAt.'));
    }

    if (new Date(props.startsAt) <= new Date()) {
      return fail(new ValidationError('startsAt', 'Must be in the future.'));
    }

    return ok(
      new BookingEntity(
        EntityId.generate(),
        EntityCode.generate(),
        props.customerId,
        props.customerCode,
        props.customerName,
        props.establishmentId,
        props.establishmentCode,
        props.serviceId,
        props.serviceCode,
        props.serviceName,
        props.resourceId,
        props.resourceCode,
        props.resourceName,
        props.startsAt,
        props.endsAt,
        'confirmed',
        props.servicePrice,
        props.serviceDuration
      )
    );
  }

  cancel(): Result<BookingEntity, ValidationError> {
    if (this._status === 'cancelled') {
      return fail(new ValidationError('status', 'Booking is already cancelled.'));
    }

    if (new Date(this._startsAt) <= new Date()) {
      return fail(new ValidationError('startsAt', 'Cannot cancel a past booking.'));
    }

    this._status = 'cancelled';

    return ok(this);
  }

  static reconstruct(props: ReconstructProps): BookingEntity {
    return new BookingEntity(
      props.id,
      props.code,
      props.customerId,
      props.customerCode,
      props.customerName,
      props.establishmentId,
      props.establishmentCode,
      props.serviceId,
      props.serviceCode,
      props.serviceName,
      props.resourceId,
      props.resourceCode,
      props.resourceName,
      props.startsAt,
      props.endsAt,
      props.status,
      props.servicePrice,
      props.serviceDuration
    );
  }

  private static validateDateTime(value: string, field: string): ValidationError | null {
    if (!ISO_DATE_REGEX.test(value)) {
      return new ValidationError(field, 'Must be a valid ISO 8601 datetime string.');
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return new ValidationError(field, 'Must be a valid date.');
    }

    return null;
  }
}
