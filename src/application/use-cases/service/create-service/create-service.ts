import { Service, type ServiceRepository, type ServiceValidationError } from '@app/domain/entities';
import type { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentCode: string;
  userId: string;
};

export class CreateService {
  constructor(
    private readonly establishmentLoader: EstablishmentLoader,
    private readonly serviceRepository: ServiceRepository
  ) {}

  async execute({
    name,
    description,
    duration,
    establishmentCode,
    userId,
  }: Input): PromiseResult<
    ServiceDTO,
    ServiceValidationError | StorageError | NotFoundError | ForbiddenError
  > {
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const establishment = establishmentResult.data;

    const serviceResult = Service.create({
      name,
      description,
      duration,
      establishmentId: establishment.id,
      establishmentCode,
    });
    if (!serviceResult.isOk) return serviceResult;

    const service = serviceResult.data;
    const saveResult = await this.serviceRepository.save(service);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceMapper.toDTO(service));
  }
}
