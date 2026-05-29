import type { Establishment, EstablishmentRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class EstablishmentLoader {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async load(code: string): PromiseResult<Establishment, StorageError | NotFoundError> {
    const result = await this.establishmentRepository.findByCode(code);
    if (!result.isOk) return result;

    const establishment = result.data;
    if (!establishment) return fail(new NotFoundError('Establishment', code));

    return ok(establishment);
  }

  async loadOwnedByUser(
    code: string,
    userId: string
  ): PromiseResult<Establishment, StorageError | NotFoundError | ForbiddenError> {
    const result = await this.load(code);
    if (!result.isOk) return result;

    const establishment = result.data;
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    return ok(establishment);
  }
}
