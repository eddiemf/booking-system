import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';

export type ServiceCreationError = ValidationError;

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
    private _duration: number,
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

  get duration(): number {
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
  }: Props): Result<ServiceEntity, ServiceCreationError> {
    if (!name) return fail(new ValidationError('name', 'Value is required.'));
    if (duration <= 0) return fail(new ValidationError('duration', 'Value is required.'));

    return ok(new ServiceEntity(v7(), nanoid(10), name, description, duration, establishmentId));
  }

  static reconstruct({ id, code, name, duration, description, establishmentId }: ReconstructProps) {
    return new ServiceEntity(id, code, name, description, duration, establishmentId);
  }
}
