import { AppError } from '@shared/errors';

export class StorageError extends AppError<'StorageError'> {
  constructor(message: string) {
    super(message, 'StorageError');
  }
}
