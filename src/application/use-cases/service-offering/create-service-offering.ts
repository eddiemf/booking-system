import type {
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import { ServiceOffering } from '@app/domain/entities';
import {
  type ConflictError,
  type ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceOfferingDTO } from '../../dtos';
import { ServiceOfferingMapper } from '../../mappers/service-offering';

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
    private readonly serviceRepository: ServiceRepository,
    private readonly resourceRepository: ResourceRepository,
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
      this.serviceRepository.findByCode(serviceCode, establishmentCode),
      this.resourceRepository.findByCode(resourceCode),
    ]);

    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', serviceCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));
    if (resource.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', resourceCode));
    }

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

    return ok(ServiceOfferingMapper.toDTO(saveResult.data, serviceCode, resource));
  }
}
