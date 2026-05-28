import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

export class Price {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  equals(other: Price): boolean {
    return this._value === other.value;
  }

  static create(value: number, field: string): Result<Price, ValidationError> {
    if (!Number.isInteger(value) || value < 0) {
      return fail(new ValidationError(field, 'Must be a non-negative integer.'));
    }

    return ok(new Price(value));
  }

  static from(value: number): Price {
    return new Price(value);
  }
}
