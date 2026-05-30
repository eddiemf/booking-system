import type { EstablishmentCreationError, EstablishmentRepository } from '@app/domain/entities';
import type { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

interface Input {
  code: string;
  name: string;
  timezone?: string | undefined;
  userId: string;
}

export class UpdateEstablishment {
  constructor(
    private readonly establishmentLoader: EstablishmentLoader,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    code,
    name,
    timezone,
    userId,
  }: Input): PromiseResult<
    EstablishmentDTO,
    EstablishmentCreationError | StorageError | NotFoundError | ForbiddenError
  > {
    const result = await this.establishmentLoader.loadOwnedByUser(code, userId);
    if (!result.isOk) return result;

    const establishment = result.data;
    const updateValidation = establishment.update({ name, timezone });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.establishmentRepository.update(code, establishment);
    if (!updateResult.isOk) return updateResult;

    return ok(EstablishmentMapper.toDTO(establishment));
  }
}
