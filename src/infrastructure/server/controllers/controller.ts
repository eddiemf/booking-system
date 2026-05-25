import { ValidationError } from '@app/domain/errors';
import type { ErrorResult } from '@shared/result/result';
import type z from 'zod';

export interface ErrorResponse {
  message: string;
  code: string;
}

export abstract class Controller {
  protected mapZodValidationError(error: z.ZodError): ErrorResponse {
    const [issue] = error.issues;
    if (!issue) throw new Error('Unexpected validation error format');

    const field = String(issue.path[0]);
    const message = issue.message;
    const validationError = new ValidationError(field, message);

    return {
      message: validationError.message,
      code: validationError.code,
    };
  }

  protected getInternalServerError(): ErrorResponse {
    return {
      message: 'Something went wrong. Try again later.',
      code: 'InternalServerError',
    };
  }

  protected mapErrorFromResult(
    result: ErrorResult<{ message: string; code: string }>
  ): ErrorResponse {
    return {
      message: result.error.message,
      code: result.error.code,
    };
  }
}
