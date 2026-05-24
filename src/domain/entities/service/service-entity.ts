import { ValidationError } from '@domain/errors';
import { Error, Ok, type Result } from '@shared/result';
import { v4 } from 'uuid';

export type ServiceCreationError = ValidationError;

interface ServiceEntityProps {
  id?: string;
  name: string;
  description?: string;
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
    if (!name) return Error(new ValidationError('name', 'Value is required.'));
    if (duration <= 0) return Error(new ValidationError('duration', 'Value is required.'));

    return Ok(new ServiceEntity(id, name, description, duration));
  }
}
