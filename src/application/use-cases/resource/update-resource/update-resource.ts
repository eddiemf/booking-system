import type { ResourceRepository } from '@app/domain/entities';
import type {
  ForbiddenError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader } from '@app/loaders';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

interface Input {
  code: string;
  establishmentCode: string;
  name: string;
  userId: string;
}

export class UpdateResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly resourceLoader: ResourceLoader,
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    code,
    establishmentCode,
    name,
    userId,
  }: Input): PromiseResult<
    ResourceDTO,
    ValidationError | StorageError | NotFoundError | ForbiddenError
  > {
    const [establishmentResult, resourceResult] = await Promise.all([
      this.establishmentLoader.loadOwnedByUser(establishmentCode, userId),
      this.resourceLoader.load(code, establishmentCode),
    ]);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!resourceResult.isOk) return resourceResult;

    const resource = resourceResult.data;
    const updateValidation = resource.update({ name });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.resourceRepository.update(resource);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(resource));
  }
}
