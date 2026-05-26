import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { v7 } from 'uuid';
import { TimeOfDay } from './time-of-day';

export type ScheduleCreationError = ValidationError;

interface Props {
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ReconstructProps {
  id: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export class ScheduleEntity {
  private constructor(
    private _id: string,
    private _resourceId: string,
    private _dayOfWeek: number,
    private _startTime: TimeOfDay,
    private _endTime: TimeOfDay
  ) {}

  get id(): string {
    return this._id;
  }

  get resourceId(): string {
    return this._resourceId;
  }

  get dayOfWeek(): number {
    return this._dayOfWeek;
  }

  get startTime(): string {
    return this._startTime.value;
  }

  get endTime(): string {
    return this._endTime.value;
  }

  static create({
    resourceId,
    dayOfWeek,
    startTime,
    endTime,
  }: Props): Result<ScheduleEntity, ScheduleCreationError> {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return fail(new ValidationError('dayOfWeek', 'Must be an integer between 0 and 6.'));
    }

    const startResult = TimeOfDay.create(startTime, 'startTime');
    if (!startResult.isOk) return startResult;

    const endResult = TimeOfDay.create(endTime, 'endTime');
    if (!endResult.isOk) return endResult;

    if (!endResult.data.isAfter(startResult.data)) {
      return fail(new ValidationError('endTime', 'Must be after startTime.'));
    }

    return ok(new ScheduleEntity(v7(), resourceId, dayOfWeek, startResult.data, endResult.data));
  }

  static reconstruct({
    id,
    resourceId,
    dayOfWeek,
    startTime,
    endTime,
  }: ReconstructProps): ScheduleEntity {
    return new ScheduleEntity(
      id,
      resourceId,
      dayOfWeek,
      TimeOfDay.from(startTime),
      TimeOfDay.from(endTime)
    );
  }
}
