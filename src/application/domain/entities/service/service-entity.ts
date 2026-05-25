import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { v4 } from 'uuid';

export type ServiceCreationError = ValidationError;

interface ServiceEntityProps {
  id?: string;
  name: string;
  description?: string | undefined;
  duration: number;
}

export class ServiceEntity {
  private constructor(
    private _id: string,
    private _name: string,
    private _description: string,
    private _duration: number
  ) {}

  get id(): string {
    return this._id;
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

  static create({
    name,
    duration,
    description = '',
    id = v4(),
  }: ServiceEntityProps): Result<ServiceEntity, ServiceCreationError> {
    if (!name) return fail(new ValidationError('name', 'Value is required.'));
    if (duration <= 0) return fail(new ValidationError('duration', 'Value is required.'));

    return ok(new ServiceEntity(id, name, description, duration));
  }
}
