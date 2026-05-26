import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import { Duration } from './duration/duration';

export type ServiceValidationError = ValidationError;

interface Props {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentId: string;
  establishmentCode: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  description: string;
  duration: number;
  establishmentId: string;
  establishmentCode: string;
}

export class ServiceEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _description: string,
    private _duration: Duration,
    private _establishmentId: string,
    private _establishmentCode: string
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

  get description(): string {
    return this._description;
  }

  get duration(): Duration {
    return this._duration;
  }

  get establishmentId(): string {
    return this._establishmentId;
  }

  get establishmentCode(): string {
    return this._establishmentCode;
  }

  static create({
    name,
    duration,
    description = '',
    establishmentId,
    establishmentCode,
  }: Props): Result<ServiceEntity, ServiceValidationError> {
    const nameError = ServiceEntity.requireName(name);
    if (nameError) return fail(nameError);

    const durationResult = Duration.create(duration, 'duration');
    if (!durationResult.isOk) return durationResult;

    return ok(
      new ServiceEntity(
        EntityId.generate(),
        EntityCode.generate(),
        name,
        description,
        durationResult.data,
        establishmentId,
        establishmentCode
      )
    );
  }

  update({
    name,
    description = '',
    duration,
  }: {
    name: string;
    description?: string | undefined;
    duration: number;
  }): Result<ServiceEntity, ServiceValidationError> {
    const nameError = ServiceEntity.requireName(name);
    if (nameError) return fail(nameError);

    const durationResult = Duration.create(duration, 'duration');
    if (!durationResult.isOk) return durationResult;

    this._name = name;
    this._description = description;
    this._duration = durationResult.data;

    return ok(this);
  }

  static reconstruct({
    id,
    code,
    name,
    duration,
    description,
    establishmentId,
    establishmentCode,
  }: ReconstructProps) {
    return new ServiceEntity(
      id,
      code,
      name,
      description,
      Duration.from(duration),
      establishmentId,
      establishmentCode
    );
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }
}
