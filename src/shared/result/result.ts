export type Result<T, E> = { isOk: true; data: T } | { isOk: false; error: E };

export type PromiseResult<T, E> = Promise<Result<T, E>>;

export const Ok = <T>(data: T): Result<T, never> => ({ isOk: true, data });

export const Fail = <E>(error: E): Result<never, E> => ({
  isOk: false,
  error,
});
