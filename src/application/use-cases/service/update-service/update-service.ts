import type { ServiceRepository } from '@app/domain/entities';
import type {
  ForbiddenError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { EstablishmentLoader, ServiceLoader } from '@app/loaders';
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
    private readonly serviceLoader: ServiceLoader,
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
    const [establishmentResult, serviceResult] = await Promise.all([
      this.establishmentLoader.loadOwnedByUser(establishmentCode, userId),
      this.serviceLoader.load(code, establishmentCode),
    ]);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!serviceResult.isOk) return serviceResult;

    const service = serviceResult.data;
    const updateValidation = service.update({ name, description, duration });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.serviceRepository.update(code, establishmentCode, service);
    if (!updateResult.isOk) return updateResult;

    return ok(ServiceMapper.toDTO(service));
  }
}
