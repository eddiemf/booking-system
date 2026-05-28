import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

export class Capacity {
  private constructor(private readonly _value: number) {}

  get value(): number {
    return this._value;
  }

  equals(other: Capacity): boolean {
    return this._value === other.value;
  }

  static create(value: number, field: string): Result<Capacity, ValidationError> {
    if (!Number.isInteger(value) || value < 1) {
      return fail(new ValidationError(field, 'Must be a positive integer.'));
    }

    return ok(new Capacity(value));
  }

  static from(value: number): Capacity {
    return new Capacity(value);
  }
}
