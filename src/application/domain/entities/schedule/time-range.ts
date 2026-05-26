import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import { TimeOfDay } from './time-of-day';

export class TimeRange {
  private constructor(
    private readonly _start: TimeOfDay,
    private readonly _end: TimeOfDay
  ) {}

  get start(): TimeOfDay {
    return this._start;
  }

  get end(): TimeOfDay {
    return this._end;
  }

  durationInMinutes(): number {
    return this._end.toMinutes() - this._start.toMinutes();
  }

  contains(time: TimeOfDay): boolean {
    return time.toMinutes() >= this._start.toMinutes() && time.toMinutes() <= this._end.toMinutes();
  }

  overlapsWith(other: TimeRange): boolean {
    return (
      this._start.toMinutes() < other.end.toMinutes() &&
      this._end.toMinutes() > other.start.toMinutes()
    );
  }

  equals(other: TimeRange): boolean {
    return this._start.equals(other.start) && this._end.equals(other.end);
  }

  static create(start: string, end: string): Result<TimeRange, ValidationError> {
    const startResult = TimeOfDay.create(start, 'startTime');
    if (!startResult.isOk) return startResult;

    const endResult = TimeOfDay.create(end, 'endTime');
    if (!endResult.isOk) return endResult;

    if (!endResult.data.isAfter(startResult.data)) {
      return fail(new ValidationError('endTime', 'Must be after startTime.'));
    }

    return ok(new TimeRange(startResult.data, endResult.data));
  }

  static from(start: string, end: string): TimeRange {
    return new TimeRange(TimeOfDay.from(start), TimeOfDay.from(end));
  }
}
