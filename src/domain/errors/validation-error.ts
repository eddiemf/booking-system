import { AppError } from '@shared/errors';

export class ValidationError extends AppError<'ValidationError'> {
  constructor(field: string, message: string) {
    super(`Invalid value for field: ${field}. ${message}`, 'ValidationError');
  }
}
