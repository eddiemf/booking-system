import {
  Establishment,
  type EstablishmentCreationError,
  type EstablishmentRepository,
} from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

interface Input {
  name: string;
  userId: string;
  timezone?: string | undefined;
}

export class CreateEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    name,
    userId,
    timezone,
  }: Input): PromiseResult<EstablishmentDTO, EstablishmentCreationError | StorageError> {
    const establishmentResult = Establishment.create({ name, userId, timezone });
    if (!establishmentResult.isOk) return establishmentResult;

    const establishment = establishmentResult.data;

    const saveResult = await this.establishmentRepository.save(establishment);
    if (!saveResult.isOk) return saveResult;

    return ok(EstablishmentMapper.toDTO(establishment));
  }
}
