import type { EstablishmentCreationError, EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

type Input = {
  code: string;
  name: string;
};

export class UpdateEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    code,
    name,
  }: Input): PromiseResult<
    EstablishmentDTO,
    EstablishmentCreationError | StorageError | NotFoundError
  > {
    const findResult = await this.establishmentRepository.findByCode(code);
    if (!findResult.isOk) return findResult;
    if (!findResult.data) return fail(new NotFoundError('Establishment', code));

    const establishment = findResult.data;
    const editedEstablishmentResult = establishment.update({ name });
    if (!editedEstablishmentResult.isOk) return editedEstablishmentResult;

    const editedEstablishment = editedEstablishmentResult.data;
    const updateResult = await this.establishmentRepository.update(code, editedEstablishment);
    if (!updateResult.isOk) return updateResult;

    return ok(EstablishmentMapper.toDTO(updateResult.data));
  }
}
