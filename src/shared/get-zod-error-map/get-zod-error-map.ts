import { match } from 'ts-pattern';
import z from 'zod';

export function getZodErrorMap() {
  return (issue: z.ZodIssueOptionalMessage) => {
    return match(issue)
      .with({ code: z.ZodIssueCode.invalid_type }, (issue) => ({
        message: `Field '${issue.path}' is invalid. Expected ${issue.expected} but received ${issue.received}.`,
      }))
      .otherwise(() => ({ message: `Field '${issue.path}' is invalid.` }));
  };
}
