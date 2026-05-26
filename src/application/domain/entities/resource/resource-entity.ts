import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';
import type { ScheduleEntity } from '../schedule/schedule-entity';

export type ResourceCreationError = ValidationError;

interface Props {
  name: string;
  establishmentId: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  establishmentId: string;
  schedules?: ScheduleEntity[];
}

export class ResourceEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _establishmentId: string,
    private _schedules: ScheduleEntity[]
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

  get establishmentId(): string {
    return this._establishmentId;
  }

  get schedules(): ScheduleEntity[] {
    return this._schedules;
  }

  static create({ name, establishmentId }: Props): Result<ResourceEntity, ResourceCreationError> {
    if (!name) return fail(new ValidationError('name', 'Value is required.'));
    return ok(new ResourceEntity(v7(), nanoid(10), name, establishmentId, []));
  }

  static reconstruct({
    id,
    code,
    name,
    establishmentId,
    schedules = [],
  }: ReconstructProps): ResourceEntity {
    return new ResourceEntity(id, code, name, establishmentId, schedules);
  }
}
