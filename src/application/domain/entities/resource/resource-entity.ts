import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import { Schedule } from '../schedule/schedule-entity';

export type ResourceValidationError = ValidationError;

interface Props {
  name: string;
  establishmentId: string;
  establishmentCode: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  name: string;
  establishmentId: string;
  establishmentCode: string;
  schedules?: Schedule[];
}

export class Resource {
  private constructor(
    private _id: string,
    private _code: string,
    private _name: string,
    private _establishmentId: string,
    private _establishmentCode: string,
    private _schedules: Schedule[]
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

  get establishmentCode(): string {
    return this._establishmentCode;
  }

  get schedules(): Schedule[] {
    return this._schedules;
  }

  update({ name }: { name: string }): Result<Resource, ResourceValidationError> {
    const nameError = Resource.requireName(name);
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
  ): Result<Resource, ValidationError> {
    const schedules: Schedule[] = [];

    for (const entry of entries) {
      const scheduleResult = Schedule.create({ ...entry, resourceId: this._id });
      if (!scheduleResult.isOk) return scheduleResult;

      schedules.push(scheduleResult.data);
    }

    this._schedules = schedules;

    return ok(this);
  }

  static create({
    name,
    establishmentId,
    establishmentCode,
  }: Props): Result<Resource, ResourceValidationError> {
    const nameError = Resource.requireName(name);
    if (nameError) return fail(nameError);

    return ok(
      new Resource(
        EntityId.generate(),
        EntityCode.generate(),
        name,
        establishmentId,
        establishmentCode,
        []
      )
    );
  }

  static reconstruct({
    id,
    code,
    name,
    establishmentId,
    establishmentCode,
    schedules = [],
  }: ReconstructProps): Resource {
    return new Resource(id, code, name, establishmentId, establishmentCode, schedules);
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }
}
