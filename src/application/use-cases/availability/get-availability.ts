import type {
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import { NotFoundError, type StorageError, type ValidationError } from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { AvailabilitySlotDTO } from '../../dtos';

type Input = {
  serviceCode: string;
  establishmentCode: string;
  date: string; // YYYY-MM-DD
};

type GetAvailabilityError = StorageError | NotFoundError;

export class GetAvailability {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly availabilityService: AvailabilityService
  ) {}

  async execute({
    serviceCode,
    establishmentCode,
    date,
  }: Input): PromiseResult<AvailabilitySlotDTO[], GetAvailabilityError | ValidationError> {
    const dateValidation = this.availabilityService.validateDate(date);
    if (!dateValidation.isOk) return dateValidation;

    const serviceResult = await this.serviceRepository.findByCode(serviceCode, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;
    if (!serviceResult.data) return fail(new NotFoundError('Service', serviceCode));

    const offeringsResult = await this.serviceOfferingRepository.findByServiceCode(
      serviceCode,
      establishmentCode
    );
    if (!offeringsResult.isOk) return offeringsResult;
    if (offeringsResult.data.length === 0) return ok([]);

    const offerings = offeringsResult.data;
    const resourceIds = offerings.map((offering) => offering.resourceId);

    const resourcesResult = await this.resourceRepository.findByIds(resourceIds, establishmentCode);
    if (!resourcesResult.isOk) return resourcesResult;

    const offeringByResource = new Map(
      offerings.map((offering) => [offering.resourceId, offering])
    );

    const slots: AvailabilitySlotDTO[] = [];

    for (const resource of resourcesResult.data) {
      const offering = offeringByResource.get(resource.id);
      if (!offering) continue;

      const resourceSlots = this.availabilityService.generateResourceSlots({
        date,
        resource,
        offering,
      });

      slots.push(...resourceSlots);
    }

    return ok(slots);
  }
}
