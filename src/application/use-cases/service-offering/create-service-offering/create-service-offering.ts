import type { ServiceOfferingRepository } from '@app/domain/entities';
import { ServiceOffering } from '@app/domain/entities';
import type {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader, ServiceLoader } from '@app/loaders';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceOfferingDTO } from '../../../dtos';
import { ServiceOfferingMapper } from '../../../mappers/service-offering';

type Input = {
  serviceCode: string;
  resourceCode: string;
  establishmentCode: string;
  userId: string;
  maxCapacity?: number | undefined;
  duration: number;
  slotInterval: number;
  price?: number | undefined;
};

export class CreateServiceOffering {
  constructor(
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly serviceLoader: ServiceLoader,
    private readonly resourceLoader: ResourceLoader,
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    userId,
    maxCapacity,
    duration,
    slotInterval,
    price,
  }: Input): PromiseResult<
    ServiceOfferingDTO,
    StorageError | NotFoundError | ForbiddenError | ConflictError | ValidationError
  > {
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const [serviceResult, resourceResult] = await Promise.all([
      this.serviceLoader.load(serviceCode, establishmentCode),
      this.resourceLoader.load(resourceCode, establishmentCode),
    ]);
    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const service = serviceResult.data;
    const resource = resourceResult.data;

    const entity = ServiceOffering.create({
      serviceId: service.id,
      resourceId: resource.id,
      maxCapacity,
      duration,
      slotInterval,
      price,
    });
    if (!entity.isOk) return entity;

    const saveResult = await this.serviceOfferingRepository.assign(entity.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceOfferingMapper.toDTO(entity.data, serviceCode, resource));
  }
}
