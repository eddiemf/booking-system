import type { ResourceRepository } from '@app/domain/entities';
import type { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { establishmentCode: string };

export class ListResources {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    establishmentCode,
  }: Input): PromiseResult<ResourceDTO[], StorageError | NotFoundError> {
    const result = await this.resourceRepository.get(establishmentCode);
    if (!result.isOk) return result;

    return ok(result.data.map(ResourceMapper.toDTO));
  }
}
