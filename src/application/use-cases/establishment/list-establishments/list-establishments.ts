import type { EstablishmentRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

interface Input {
  limit: number;
  offset: number;
}

export class ListEstablishments {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({ limit, offset }: Input): PromiseResult<EstablishmentDTO[], StorageError> {
    const result = await this.establishmentRepository.findAll(limit, offset);
    if (!result.isOk) return result;

    const establishments = result.data;

    return ok(establishments.map(EstablishmentMapper.toDTO));
  }
}
