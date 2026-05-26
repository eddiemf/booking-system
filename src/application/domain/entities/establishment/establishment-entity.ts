import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';

export type EstablishmentCreationError = ValidationError;

interface Props {
  name: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
}

export class EstablishmentEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string
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

  static create({ name }: Props): Result<EstablishmentEntity, EstablishmentCreationError> {
    if (!name) return fail(new ValidationError('name', 'Value is required.'));

    return ok(new EstablishmentEntity(v7(), nanoid(10), name));
  }

  static reconstruct({ id, code, name }: ReconstructProps): EstablishmentEntity {
    return new EstablishmentEntity(id, code, name);
  }
}
