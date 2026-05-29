import type { ResourceRepository } from '@app/domain/entities';
import type { ForbiddenError, StorageError, ValidationError } from '@app/domain/errors';
import { NotFoundError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
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
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', code));

    if (resource.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    const updateValidation = resource.update({ name });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.resourceRepository.update(resource);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(resource));
  }
}
