import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';

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
}

export class Establishment {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _userId: string
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

  static create({ name, userId }: Props): Result<Establishment, EstablishmentCreationError> {
    const nameError = Establishment.requireName(name);
    if (nameError) return fail(nameError);

    return ok(new Establishment(EntityId.generate(), EntityCode.generate(), name, userId));
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

  static reconstruct({ id, code, name, userId }: ReconstructProps): Establishment {
    return new Establishment(id, code, name, userId);
  }
}
