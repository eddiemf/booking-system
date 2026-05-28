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
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const serviceResult = await this.serviceRepository.findByCode(serviceCode, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;
    if (!serviceResult.data) return fail(new NotFoundError('Service', serviceCode));

    const resourceResult = await this.resourceRepository.findByCode(resourceCode);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', resourceCode));
    if (resourceResult.data.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', resourceCode));
    }

    const entity = ServiceOfferingEntity.create({
      serviceId: serviceResult.data.id,
      resourceId: resourceResult.data.id,
      maxCapacity,
      durationMinutes,
      slotIntervalMinutes,
    });
    if (!entity.isOk) return entity;

    const saveResult = await this.serviceOfferingRepository.assign(entity.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceOfferingMapper.toDTO(saveResult.data, serviceCode, resourceResult.data));
  }
}
