import { ValidationError } from '@app/domain/errors';
import type { ErrorResult } from '@shared/result/result';
import type { Response } from 'express';
import type z from 'zod';

export interface ErrorResponse {
  message: string;
  code: string;
}

export abstract class Controller {
  private static readonly ERROR_STATUS_MAP: Record<string, number> = {
    ValidationError: 400,
    NotFoundError: 404,
    ConflictError: 409,
    ForbiddenError: 403,
    AuthenticationError: 401,
    InternalServerError: 500,
  };

  protected mapZodValidationError(error: z.ZodError): ErrorResponse {
    const [issue] = error.issues;
    if (!issue) throw new Error('Unexpected validation error format');

    const field = String(issue.path[issue.path.length - 1]);
    const message = issue.message;
    const validationError = new ValidationError(field, message);

    return {
      message: validationError.message,
      code: validationError.code,
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

  protected sendError(
    res: Response,
    result?: ErrorResult<{ code: string; message: string }>
  ): Response {
    const statusCode = Controller.ERROR_STATUS_MAP[result?.error.code || 'InternalServerError'];
    if (!result || statusCode === undefined) {
      return res.status(500).json({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    }

    return res.status(statusCode).json({
      message: result.error.message,
      code: result.error.code,
    });
  }

  protected sendZodError(res: Response, error: z.ZodError): void {
    res.status(400).json(this.mapZodValidationError(error));
  }
}
