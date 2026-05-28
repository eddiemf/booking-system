import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import type { Resource } from '../resource/resource-entity';
import type { Service } from '../service/service-entity';

export type EstablishmentCreationError = ValidationError;

interface Props {
  name: string;
  userId: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  userId: string;
  resources?: Resource[];
  services?: Service[];
}

export class Establishment {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _userId: string,
    private _resources: Resource[],
    private _services: Service[]
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

  get resources(): Resource[] {
    return this._resources;
  }

  get services(): Service[] {
    return this._services;
  }

  static create({ name, userId }: Props): Result<Establishment, EstablishmentCreationError> {
    const nameError = Establishment.requireName(name);
    if (nameError) return fail(nameError);

    return ok(new Establishment(EntityId.generate(), EntityCode.generate(), name, userId, [], []));
  }

  update({ name }: { name: string }): Result<Establishment, ValidationError> {
    const nameError = Establishment.requireName(name);
    if (nameError) return fail(nameError);

    this._name = name;

    return ok(this);
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }

  static reconstruct({
    id,
    code,
    name,
    userId,
    resources = [],
    services = [],
  }: ReconstructProps): Establishment {
    return new Establishment(id, code, name, userId, resources, services);
  }
}
