import type { EstablishmentCreationError, EstablishmentRepository } from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

type Input = {
  code: string;
  name: string;
  userId: string;
};

export class UpdateEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    code,
    name,
    userId,
  }: Input): PromiseResult<
    EstablishmentDTO,
    EstablishmentCreationError | StorageError | NotFoundError | ForbiddenError
  > {
    const findResult = await this.establishmentRepository.findByCode(code);
    if (!findResult.isOk) return findResult;
    if (!findResult.data) return fail(new NotFoundError('Establishment', code));

    const establishment = findResult.data;
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const updateValidation = establishment.update({ name });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.establishmentRepository.update(code, establishment);
    if (!updateResult.isOk) return updateResult;

    return ok(EstablishmentMapper.toDTO(updateResult.data));
  }
}
