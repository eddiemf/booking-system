import type {
  EstablishmentRepository,
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import { ServiceOfferingEntity } from '@app/domain/entities';
import {
  type ConflictError,
  ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceOfferingDTO } from '../../dtos';
import { ServiceOfferingMapper } from '../../mappers/service-offering';

type Input = {
  serviceCode: string;
  resourceCode: string;
  establishmentCode: string;
  userId: string;
  maxCapacity?: number | undefined;
  durationMinutes: number;
  slotIntervalMinutes: number;
};

export class CreateServiceOffering {
  constructor(
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    userId,
    maxCapacity,
    durationMinutes,
    slotIntervalMinutes,
  }: Input): PromiseResult<
    ServiceOfferingDTO,
    StorageError | NotFoundError | ForbiddenError | ConflictError | ValidationError
  > {
    const [establishmentResult, serviceResult, resourceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.serviceRepository.findByCode(serviceCode, establishmentCode),
      this.resourceRepository.findByCode(resourceCode),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', serviceCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));
    if (resource.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', resourceCode));
    }

    const entity = ServiceOfferingEntity.create({
      serviceId: service.id,
      resourceId: resource.id,
      maxCapacity,
      durationMinutes,
      slotIntervalMinutes,
    });
    if (!entity.isOk) return entity;

    const saveResult = await this.serviceOfferingRepository.assign(entity.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceOfferingMapper.toDTO(saveResult.data, serviceCode, resource));
  }
}
