import type { EstablishmentRepository, ServiceRepository } from '@app/domain/entities';
import {
  type ConflictError,
  ForbiddenError,
  NotFoundError,
  type StorageError,
} from '@app/domain/errors';
import { fail, type PromiseResult } from '@shared/result';

type Input = { code: string; establishmentCode: string; userId: string };

export class DeleteService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    code,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ConflictError | ForbiddenError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    return this.serviceRepository.delete(code, establishmentCode);
  }
}
