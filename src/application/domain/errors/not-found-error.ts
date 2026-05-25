import { AppError } from '@shared/errors';

export class NotFoundError extends AppError<'NotFoundError'> {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} was not found.`, 'NotFoundError');
  }
}
