import type {
  EstablishmentRepository,
  ResourceRepository,
  ResourceType,
} from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { establishmentId: string; type?: ResourceType };

export class ListResources {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly resourceRepository: ResourceRepository
  ) {}

  async execute({
    establishmentId,
    type,
  }: Input): PromiseResult<ResourceDTO[], StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findById(establishmentId);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data) return fail(new NotFoundError('Establishment', establishmentId));

    const resourcesResult = await this.resourceRepository.findAll(establishmentId, type);
    if (!resourcesResult.isOk) return resourcesResult;

    return ok(resourcesResult.data.map(ResourceMapper.toDTO));
  }
}
