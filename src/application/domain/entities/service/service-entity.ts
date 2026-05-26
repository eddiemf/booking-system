import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';
import { Duration } from './duration';

export type ServiceValidationError = ValidationError;

interface Props {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentId: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  description: string;
  duration: number;
  establishmentId: string;
}

export class ServiceEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _description: string,
    private _duration: Duration,
    private _establishmentId: string
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

  static create({
    name,
    duration,
    description = '',
    establishmentId,
  }: Props): Result<ServiceEntity, ServiceValidationError> {
    const nameError = ServiceEntity.requireName(name);
    if (nameError) return fail(nameError);

    const durationResult = Duration.create(duration, 'duration');
    if (!durationResult.isOk) return durationResult;

    return ok(
      new ServiceEntity(v7(), nanoid(10), name, description, durationResult.data, establishmentId)
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

  static reconstruct({ id, code, name, duration, description, establishmentId }: ReconstructProps) {
    return new ServiceEntity(id, code, name, description, Duration.from(duration), establishmentId);
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }
}
