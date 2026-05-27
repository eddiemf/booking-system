export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === '23503';
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === '23505';
}
