import {
  type EstablishmentCreationError,
  EstablishmentEntity,
  type EstablishmentRepository,
} from '@app/domain/entities';
import type { NotFoundError, StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

type Input = {
  id: string;
  name: string;
};

export class UpdateEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    id,
    name,
  }: Input): PromiseResult<
    EstablishmentDTO,
    EstablishmentCreationError | StorageError | NotFoundError
  > {
    const entityResult = EstablishmentEntity.create({ name });
    if (!entityResult.isOk) return entityResult;

    const updateResult = await this.establishmentRepository.update(id, entityResult.data);
    if (!updateResult.isOk) return updateResult;

    return ok(EstablishmentMapper.toDTO(updateResult.data));
  }
}
