/**
 * Base class for all custom application errors.
 * Allows identifying specific application errors programmatically.
 */
export abstract class AppError<ErrorCodeType extends string> extends Error {
  /**
   * Application-specific error code (e.g., 'USER_NOT_FOUND').
   * This acts as a tag to differentiate between different error types.
   */
  public readonly code: ErrorCodeType;

  /**
   * The original error that caused this error, if any.
   * Standardized via ErrorOptions in modern JS/TS.
   */
  public readonly cause?: Error;

  /**
   * Creates an instance of AppError.
   * @param message - The human-readable error message. Inherited from Error.
   * @param code - Application-specific error code string. Used as a tag to identify the error type.
   * @param options - Optional. Can include 'cause' for error chaining. Inherited from Error.
   */
  constructor(message: string, code: ErrorCodeType, options?: ErrorOptions) {
    super(message, options);

    this.code = code;
    // Note: this.cause is automatically handled by super(..., options) if options = { cause: originalError }
  }
}
