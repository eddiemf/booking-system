import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';

export type ResourceType = 'employee' | 'room';

export type ResourceCreationError = ValidationError;

interface Props {
  name: string;
  type: ResourceType;
  establishmentId: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  type: ResourceType;
  establishmentId: string;
}

export class ResourceEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _type: ResourceType,
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

  get type(): ResourceType {
    return this._type;
  }

  get establishmentId(): string {
    return this._establishmentId;
  }

  static create({
    name,
    type,
    establishmentId,
  }: Props): Result<ResourceEntity, ResourceCreationError> {
    if (!name) return fail(new ValidationError('name', 'Value is required.'));
    if (type !== 'employee' && type !== 'room') {
      return fail(new ValidationError('type', 'Must be employee or room.'));
    }

    return ok(new ResourceEntity(v7(), nanoid(10), name, type, establishmentId));
  }

  static reconstruct({ id, code, name, type, establishmentId }: ReconstructProps): ResourceEntity {
    return new ResourceEntity(id, code, name, type, establishmentId);
  }
}
