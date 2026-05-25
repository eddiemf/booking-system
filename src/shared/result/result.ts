export type Result<T, E> = SuccessResult<T> | ErrorResult<E>;
export type SuccessResult<T> = { isOk: true; data: T; getData: () => T; getError: () => never };
export type ErrorResult<E> = { isOk: false; error: E; getData: () => never; getError: () => E };

export type PromiseResult<T, E> = Promise<Result<T, E>>;

export const ok = <T>(data: T): Result<T, never> => ({
  isOk: true,
  data,
  getData: () => data,
  getError: () => {
    throw new Error('Cannot get error from a success result', { cause: data });
  },
});

export const fail = <E>(error: E): Result<never, E> => ({
  isOk: false,
  error,
  getData: () => {
    throw new Error('Cannot get data from an error result', { cause: error });
  },
  getError: () => error,
});
