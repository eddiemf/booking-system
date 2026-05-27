import { AppError } from '@shared/errors';

export class ForbiddenError extends AppError<'ForbiddenError'> {
  constructor(message: string) {
    super(message, 'ForbiddenError');
  }
}
