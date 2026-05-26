import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

export class Duration {
  private constructor(private readonly _minutes: number) {}

  get value(): number {
    return this._minutes;
  }

  toMinutes(): number {
    return this._minutes;
  }

  toHours(): number {
    return this._minutes / 60;
  }

  equals(other: Duration): boolean {
    return this._minutes === other.toMinutes();
  }

  static create(value: number, field: string): Result<Duration, ValidationError> {
    if (value <= 0) {
      return fail(new ValidationError(field, 'Value must be greater than 0.'));
    }

    return ok(new Duration(value));
  }

  static from(value: number): Duration {
    return new Duration(value);
  }
}
