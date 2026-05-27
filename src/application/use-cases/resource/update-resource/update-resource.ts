import type { EstablishmentRepository, ResourceRepository } from '@app/domain/entities';
import {
  ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
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
    private readonly establishmentRepository: EstablishmentRepository
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
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

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
