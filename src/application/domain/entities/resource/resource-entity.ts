import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { nanoid } from 'nanoid';
import { v7 } from 'uuid';
import { ScheduleEntity } from '../schedule/schedule-entity';

export type ResourceValidationError = ValidationError;

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

  update({ name }: { name: string }): Result<ResourceEntity, ResourceValidationError> {
    const nameError = ResourceEntity.requireName(name);
    if (nameError) return fail(nameError);

    this._name = name;

    return ok(this);
  }

  setSchedule(
    entries: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[]
  ): Result<ResourceEntity, ValidationError> {
    const schedules: ScheduleEntity[] = [];

    for (const entry of entries) {
      const scheduleResult = ScheduleEntity.create({ ...entry, resourceId: this._id });
      if (!scheduleResult.isOk) return scheduleResult;

      schedules.push(scheduleResult.data);
    }

    this._schedules = schedules;

    return ok(this);
  }

  static create({ name, establishmentId }: Props): Result<ResourceEntity, ResourceValidationError> {
    const nameError = ResourceEntity.requireName(name);
    if (nameError) return fail(nameError);

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

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }
}
