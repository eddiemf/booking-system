import { AppError } from '@shared/errors';

export class AuthenticationError extends AppError<'AuthenticationError'> {
  constructor(message: string) {
    super(message, 'AuthenticationError');
  }
}
