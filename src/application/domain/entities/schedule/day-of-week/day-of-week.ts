import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

const LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export class DayOfWeek {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  label(): string {
    return LABELS[this._value as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  }

  isWeekend(): boolean {
    return this._value === 0 || this._value === 6;
  }

  equals(other: DayOfWeek): boolean {
    return this._value === other.value;
  }

  static create(value: number, field: string): Result<DayOfWeek, ValidationError> {
    if (!Number.isInteger(value) || value < 0 || value > 6) {
      return fail(new ValidationError(field, 'Must be an integer between 0 and 6.'));
    }

    return ok(new DayOfWeek(value));
  }

  static from(value: number): DayOfWeek {
    return new DayOfWeek(value);
  }
}
