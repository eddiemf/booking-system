import {
  type EstablishmentRepository,
  Resource,
  type ResourceRepository,
  type ResourceValidationError,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = {
  name: string;
  establishmentCode: string;
  userId: string;
};

export class CreateResource {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
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
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const creationResult = Resource.create({
      name,
      establishmentId: establishment.id,
      establishmentCode: establishment.code,
    });
    if (!creationResult.isOk) return creationResult;

    const resource = creationResult.data;
    const saveResult = await this.resourceRepository.save(resource);
    if (!saveResult.isOk) return saveResult;

    return ok(ResourceMapper.toDTO(saveResult.data));
  }
}
