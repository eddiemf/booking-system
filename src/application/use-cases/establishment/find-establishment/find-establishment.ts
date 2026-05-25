import type { EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

type Input = {
  id: string;
};

export class FindEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({ id }: Input): PromiseResult<EstablishmentDTO, NotFoundError | StorageError> {
    const result = await this.establishmentRepository.findById(id);
    if (!result.isOk) return result;

    if (result.data === null) return fail(new NotFoundError('Establishment', id));

    return ok(EstablishmentMapper.toDTO(result.data));
  }
}
