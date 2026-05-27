import { ValidationError } from '@app/domain/errors';
import { EntityCode } from '@app/domain/identity/entity-code';
import { EntityId } from '@app/domain/identity/entity-id';
import { fail, ok, type Result } from '@shared/result';
import { Email } from './email/email';

export type UserCreationError = ValidationError;

interface Props {
  email: string;
  name: string;
}

interface ReconstructProps {
  id: string;
  code: string;
  email: string;
  name: string;
}

export class UserEntity {
  private constructor(
    private _id: string,
    private _code: string,
    private _email: Email,
    private _name: string
  ) {}

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  static create({ email, name }: Props): Result<UserEntity, UserCreationError> {
    const emailResult = Email.create(email, 'email');
    if (!emailResult.isOk) return emailResult;

    const nameError = UserEntity.requireName(name);
    if (nameError) return fail(nameError);

    return ok(new UserEntity(EntityId.generate(), EntityCode.generate(), emailResult.data, name));
  }

  static reconstruct({ id, code, email, name }: ReconstructProps): UserEntity {
    return new UserEntity(id, code, Email.from(email), name);
  }

  private static requireName(name: string): ValidationError | null {
    return name ? null : new ValidationError('name', 'Value is required.');
  }
}
