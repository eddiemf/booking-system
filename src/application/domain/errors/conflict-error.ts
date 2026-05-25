import { AppError } from '@shared/errors';

export class ConflictError extends AppError<'ConflictError'> {
  constructor(message: string) {
    super(message, 'ConflictError');
  }
}
