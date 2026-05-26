import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { v7 } from 'uuid';

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

function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const sep = time.indexOf(':');
  const hh = parseInt(time.slice(0, sep), 10);
  const mm = parseInt(time.slice(sep + 1), 10);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function timeToMinutes(time: string): number {
  const sep = time.indexOf(':');
  const hh = parseInt(time.slice(0, sep), 10);
  const mm = parseInt(time.slice(sep + 1), 10);
  return hh * 60 + mm;
}

export class ScheduleEntity {
  private constructor(
    private _id: string,
    private _resourceId: string,
    private _dayOfWeek: number,
    private _startTime: string,
    private _endTime: string
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
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
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
    if (!isValidTime(startTime)) {
      return fail(
        new ValidationError(
          'startTime',
          'Must be in HH:MM format with valid hours (00-23) and minutes (00-59).'
        )
      );
    }
    if (!isValidTime(endTime)) {
      return fail(
        new ValidationError(
          'endTime',
          'Must be in HH:MM format with valid hours (00-23) and minutes (00-59).'
        )
      );
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return fail(new ValidationError('endTime', 'Must be after startTime.'));
    }

    return ok(new ScheduleEntity(v7(), resourceId, dayOfWeek, startTime, endTime));
  }

  static reconstruct({
    id,
    resourceId,
    dayOfWeek,
    startTime,
    endTime,
  }: ReconstructProps): ScheduleEntity {
    return new ScheduleEntity(id, resourceId, dayOfWeek, startTime, endTime);
  }
}
