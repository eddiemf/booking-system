import type { EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

interface Input {
  code: string;
}

export class FindEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({ code }: Input): PromiseResult<EstablishmentDTO, NotFoundError | StorageError> {
    const result = await this.establishmentRepository.findByCode(code);
    if (!result.isOk) return result;

    const establishment = result.data;
    if (!establishment) return fail(new NotFoundError('Establishment', code));

    return ok(EstablishmentMapper.toDTO(establishment));
  }
}
