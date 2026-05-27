import type { ResourceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError, type ValidationError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ResourceDTO } from '../../../dtos';
import { ResourceMapper } from '../../../mappers';

interface Input {
  code: string;
  establishmentCode: string;
  name: string;
}

export class UpdateResource {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async execute({
    code,
    establishmentCode,
    name,
  }: Input): PromiseResult<ResourceDTO, ValidationError | StorageError | NotFoundError> {
    const resourceResult = await this.resourceRepository.findByCode(code);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', code));
    if (resourceResult.data.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    const resource = resourceResult.data;
    const updateValidation = resource.update({ name });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.resourceRepository.update(code, resource);
    if (!updateResult.isOk) return updateResult;

    return ok(ResourceMapper.toDTO(updateResult.data));
  }
}
