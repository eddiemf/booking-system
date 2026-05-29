import type { ServiceRepository } from '@app/domain/entities';
import {
  type ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  code: string;
  establishmentCode: string;
  name: string;
  description?: string | undefined;
  duration: number;
  userId: string;
};

export class UpdateService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    code,
    establishmentCode,
    name,
    description,
    duration,
    userId,
  }: Input): PromiseResult<
    ServiceDTO,
    StorageError | NotFoundError | ValidationError | ForbiddenError
  > {
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const serviceResult = await this.serviceRepository.findByCode(code, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', code));

    const updateValidation = service.update({ name, description, duration });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.serviceRepository.update(code, establishmentCode, service);
    if (!updateResult.isOk) return updateResult;

    return ok(ServiceMapper.toDTO(service));
  }
}
