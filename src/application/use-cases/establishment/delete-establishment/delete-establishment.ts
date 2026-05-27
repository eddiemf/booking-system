import type { EstablishmentRepository } from '@app/domain/entities';
import {
  type ConflictError,
  ForbiddenError,
  NotFoundError,
  type StorageError,
} from '@app/domain/errors';
import { fail, type PromiseResult } from '@shared/result';

type Input = {
  code: string;
  userId: string;
};

export class DeleteEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    code,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const findResult = await this.establishmentRepository.findByCode(code);
    if (!findResult.isOk) return findResult;
    if (!findResult.data) return fail(new NotFoundError('Establishment', code));
    if (findResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    return this.establishmentRepository.delete(code);
  }
}
