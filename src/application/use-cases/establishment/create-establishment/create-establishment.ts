import {
  type EstablishmentCreationError,
  EstablishmentEntity,
  type EstablishmentRepository,
} from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

type Input = {
  name: string;
};

export class CreateEstablishment {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    name,
  }: Input): PromiseResult<EstablishmentDTO, EstablishmentCreationError | StorageError> {
    const establishmentResult = EstablishmentEntity.create({ name });
    if (!establishmentResult.isOk) return establishmentResult;

    const entity = establishmentResult.data;

    const saveResult = await this.establishmentRepository.save(entity);
    if (!saveResult.isOk) return saveResult;

    return ok(EstablishmentMapper.toDTO(saveResult.data));
  }
}
