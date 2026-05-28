import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

export class TimeOfDay {
  private constructor(
    private readonly _value: string,
    private readonly _minutes: number
  ) {}

  get value(): string {
    return this._value;
  }

  toMinutes(): number {
    return this._minutes;
  }

  isAfter(other: TimeOfDay): boolean {
    return this._minutes > other.toMinutes();
  }

  equals(other: TimeOfDay): boolean {
    return this._minutes === other.toMinutes();
  }

  static create(value: string, field: string): Result<TimeOfDay, ValidationError> {
    if (!TimeOfDay.isValidFormat(value)) {
      return fail(
        new ValidationError(
          field,
          'Must be in HH:MM format with valid hours (00-23) and minutes (00-59).'
        )
      );
    }

    return ok(new TimeOfDay(value, TimeOfDay.parseMinutes(value)));
  }

  static from(value: string): TimeOfDay {
    return new TimeOfDay(value, TimeOfDay.parseMinutes(value));
  }

  /**
   * Construct from total minutes (0–1439). Useful for converting
   * slot grid positions back to HH:MM display values.
   */
  static fromMinutes(minutes: number): TimeOfDay {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    const value = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

    return new TimeOfDay(value, minutes);
  }

  private static isValidFormat(value: string): boolean {
    if (!/^\d{2}:\d{2}$/.test(value)) return false;
    const sep = value.indexOf(':');
    const hh = parseInt(value.slice(0, sep), 10);
    const mm = parseInt(value.slice(sep + 1), 10);

    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }

  private static parseMinutes(value: string): number {
    const sep = value.indexOf(':');
    const hh = parseInt(value.slice(0, sep), 10);
    const mm = parseInt(value.slice(sep + 1), 10);

    return hh * 60 + mm;
  }
}
