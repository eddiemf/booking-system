import { v4 } from 'uuid';
import { Error, Ok, Result } from '@shared/result';
import { ValidationError } from '@domain/errors';

export type ServiceCreationError = ValidationError;

interface ServiceEntityProps {
  id?: string;
  name: string;
  description?: string;
  duration: number;
}

export class ServiceEntity {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly duration: number
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getDuration(): number {
    return this.duration;
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
