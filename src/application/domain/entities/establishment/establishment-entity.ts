import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';
import type { ResourceEntity } from '../resource/resource-entity';
import type { ServiceEntity } from '../service/service-entity';

export type EstablishmentCreationError = ValidationError;

interface Props {
  name: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  resources?: ResourceEntity[];
  services?: ServiceEntity[];
}

export class EstablishmentEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _resources: ResourceEntity[],
    private _services: ServiceEntity[]
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

  get resources(): ResourceEntity[] {
    return this._resources;
  }

  get services(): ServiceEntity[] {
    return this._services;
  }

  static create({ name }: Props): Result<EstablishmentEntity, EstablishmentCreationError> {
    const nameError = EstablishmentEntity.requireName(name);
    if (nameError) return fail(nameError);

    return ok(new EstablishmentEntity(v7(), nanoid(10), name, [], []));
  }

  update({ name }: { name: string }): Result<EstablishmentEntity, ValidationError> {
    const nameError = EstablishmentEntity.requireName(name);
    if (nameError) return fail(nameError);

    return ok(new EstablishmentEntity(this._id, this._code, name, this._resources, this._services));
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }

  static reconstruct({
    id,
    code,
    name,
    resources = [],
    services = [],
  }: ReconstructProps): EstablishmentEntity {
    return new EstablishmentEntity(id, code, name, resources, services);
  }
}
