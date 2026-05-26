import type { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { ok, type Result } from '@shared/result';
import { DayOfWeek } from './day-of-week/day-of-week';
import { TimeRange } from './time-range/time-range';

export type ScheduleCreationError = ValidationError;

interface Props {
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export class ScheduleEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _resourceId: string,
    private _dayOfWeek: DayOfWeek,
    private _timeRange: TimeRange
  ) {}

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get resourceId(): string {
    return this._resourceId;
  }

  get dayOfWeek(): DayOfWeek {
    return this._dayOfWeek;
  }

  get timeRange(): TimeRange {
    return this._timeRange;
  }

  static create({
    resourceId,
    dayOfWeek,
    startTime,
    endTime,
  }: Props): Result<ScheduleEntity, ScheduleCreationError> {
    const dayOfWeekResult = DayOfWeek.create(dayOfWeek, 'dayOfWeek');
    if (!dayOfWeekResult.isOk) return dayOfWeekResult;

    const timeRangeResult = TimeRange.create(startTime, endTime);
    if (!timeRangeResult.isOk) return timeRangeResult;

    return ok(
      new ScheduleEntity(
        EntityId.generate(),
        EntityCode.generate(),
        resourceId,
        dayOfWeekResult.data,
        timeRangeResult.data
      )
    );
  }

  static reconstruct({
    id,
    code,
    resourceId,
    dayOfWeek,
    startTime,
    endTime,
  }: ReconstructProps): ScheduleEntity {
    return new ScheduleEntity(
      id,
      code,
      resourceId,
      DayOfWeek.from(dayOfWeek),
      TimeRange.from(startTime, endTime)
    );
  }
}
