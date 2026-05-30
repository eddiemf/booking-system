import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import { DateTime } from 'luxon';

export type EstablishmentCreationError = ValidationError;

interface Props {
  name: string;
  userId: string;
  timezone?: string | undefined;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  userId: string;
  timezone?: string | undefined;
}

export class Establishment {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _userId: string,
    private _timezone: string
  ) {}

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get userId(): string {
    return this._userId;
  }

  get timezone(): string {
    return this._timezone;
  }

  static create({
    name,
    userId,
    timezone = 'UTC',
  }: Props): Result<Establishment, EstablishmentCreationError> {
    const nameError = Establishment.requireName(name);
    if (nameError) return fail(nameError);

    const timezoneError = Establishment.validateTimezone(timezone);
    if (timezoneError) return fail(timezoneError);

    return ok(
      new Establishment(EntityId.generate(), EntityCode.generate(), name, userId, timezone)
    );
  }

  update({
    name,
    timezone,
  }: {
    name: string;
    timezone?: string | undefined;
  }): Result<Establishment, ValidationError> {
    const nameError = Establishment.requireName(name);
    if (nameError) return fail(nameError);

    if (timezone !== undefined) {
      const timezoneError = Establishment.validateTimezone(timezone);
      if (timezoneError) return fail(timezoneError);
      this._timezone = timezone;
    }

    this._name = name;

    return ok(this);
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }

  private static validateTimezone(timezone: string): ValidationError | null {
    const result = DateTime.now().setZone(timezone);
    if (!result.isValid) {
      return new ValidationError(
        'timezone',
        `"${timezone}" is not a valid IANA timezone (e.g. "Europe/Warsaw").`
      );
    }
    return null;
  }

  static reconstruct({
    id,
    code,
    name,
    userId,
    timezone = 'UTC',
  }: ReconstructProps): Establishment {
    return new Establishment(id, code, name, userId, timezone);
  }
}
