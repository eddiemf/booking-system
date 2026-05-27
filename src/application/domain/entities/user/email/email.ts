import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other.value;
  }

  static create(value: string, field: string): Result<Email, ValidationError> {
    if (!value || !EMAIL_REGEX.test(value)) {
      return fail(new ValidationError(field, 'Must be a valid email address.'));
    }

    return ok(new Email(value));
  }

  static from(value: string): Email {
    return new Email(value);
  }
}
