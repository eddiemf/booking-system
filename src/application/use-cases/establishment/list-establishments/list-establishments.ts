import type { EstablishmentRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

export class ListEstablishments {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute(input: {
    limit: number;
    offset: number;
  }): PromiseResult<EstablishmentDTO[], StorageError> {
    const result = await this.establishmentRepository.findAll(input.limit, input.offset);
    if (!result.isOk) return result;

    return ok(result.data.map(EstablishmentMapper.toDTO));
  }
}
