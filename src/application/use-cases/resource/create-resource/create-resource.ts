import {
  type EstablishmentRepository,
  Resource,
  type ResourceRepository,
  type ResourceValidationError,
} from '@app/domain/entities';
import type { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

interface Input {
  name: string;
  establishmentCode: string;
  userId: string;
}

export class CreateResource {
  constructor(
    private readonly establishmentLoader: EstablishmentLoader,
    private readonly resourceRepository: ResourceRepository
  ) {}

  async execute({
    name,
    establishmentCode,
    userId,
  }: Input): PromiseResult<
    ResourceDTO,
    ResourceValidationError | StorageError | NotFoundError | ForbiddenError
  > {
    const result = await this.establishmentLoader.loadOwnedByUser(establishmentCode, userId);
    if (!result.isOk) return result;

    const establishment = result.data;
    const creationResult = Resource.create({
      name,
      establishmentId: establishment.id,
      establishmentCode: establishment.code,
    });
    if (!creationResult.isOk) return creationResult;

    const resource = creationResult.data;
    const saveResult = await this.resourceRepository.save(resource);
    if (!saveResult.isOk) return saveResult;

    return ok(ResourceMapper.toDTO(resource));
  }
}
