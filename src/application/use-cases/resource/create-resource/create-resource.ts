import {
  type EstablishmentRepository,
  ResourceEntity,
  type ResourceRepository,
  type ResourceValidationError,
} from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = {
  name: string;
  establishmentCode: string;
};

export class CreateResource {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly resourceRepository: ResourceRepository
  ) {}

  async execute({
    name,
    establishmentCode,
  }: Input): PromiseResult<ResourceDTO, ResourceValidationError | StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));

    const entityResult = ResourceEntity.create({
      name,
      establishmentId: establishmentResult.data.id,
    });
    if (!entityResult.isOk) return entityResult;

    const saveResult = await this.resourceRepository.save(entityResult.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ResourceMapper.toDTO(saveResult.data));
  }
}
