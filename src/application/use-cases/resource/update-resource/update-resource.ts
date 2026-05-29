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
    const [establishmentResult, resourceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.resourceRepository.findByCode(code),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!resourceResult.isOk) return resourceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', code));

    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    if (resource.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', code));

    const updateValidation = resource.update({ name });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.resourceRepository.update(code, resource);
    if (!updateResult.isOk) return updateResult;

    const updatedResource = updateResult.data;

    return ok(ResourceMapper.toDTO(updatedResource));
  }
}
