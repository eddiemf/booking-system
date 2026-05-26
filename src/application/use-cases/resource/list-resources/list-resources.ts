import type { EstablishmentRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { establishmentCode: string };

export class ListResources {
  constructor(private readonly establishmentRepository: EstablishmentRepository) {}

  async execute({
    establishmentCode,
  }: Input): PromiseResult<ResourceDTO[], StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));

    return ok(establishmentResult.data.resources.map(ResourceMapper.toDTO));
  }
}
