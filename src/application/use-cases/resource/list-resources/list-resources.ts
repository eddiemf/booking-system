import type {
  EstablishmentRepository,
  ResourceRepository,
  ResourceType,
} from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

type Input = { establishmentCode: string; type?: ResourceType };

export class ListResources {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly resourceRepository: ResourceRepository
  ) {}

  async execute({
    establishmentCode,
    type,
  }: Input): PromiseResult<ResourceDTO[], StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));

    const resourcesResult = await this.resourceRepository.findAll(establishmentCode, type);
    if (!resourcesResult.isOk) return resourcesResult;

    return ok(resourcesResult.data.map(ResourceMapper.toDTO));
  }
}
