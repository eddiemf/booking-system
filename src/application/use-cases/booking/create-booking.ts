import {
  BookingEntity,
  type BookingRepository,
  type ResourceRepository,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import {
  ConflictError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { BookingDTO } from '../../dtos';
import { BookingMapper } from '../../mappers/booking';

interface Input {
  serviceCode: string;
  resourceCode: string;
  establishmentCode: string;
  startsAt: string;
  userId: string;
  userCode: string;
  userName: string;
}

type CreateBookingError = StorageError | NotFoundError | ConflictError | ValidationError;

export class CreateBooking {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly availabilityService: AvailabilityService
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    startsAt,
    userId,
    userCode,
    userName,
  }: Input): PromiseResult<BookingDTO, CreateBookingError> {
    const serviceResult = await this.serviceRepository.findByCode(serviceCode, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;
    if (!serviceResult.data) return fail(new NotFoundError('Service', serviceCode));

    const resourceResult = await this.resourceRepository.findByCode(resourceCode);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', resourceCode));
    if (resourceResult.data.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', resourceCode));
    }
    const resource = resourceResult.data;

    const offeringsResult = await this.serviceOfferingRepository.findByServiceCode(
      serviceCode,
      establishmentCode
    );
    if (!offeringsResult.isOk) return offeringsResult;

    const offering = offeringsResult.data.find((offering) => offering.resourceId === resource.id);
    if (!offering) {
      return fail(new NotFoundError('Resource', resourceCode));
    }

    const slotResult = this.availabilityService.resolveTimeSlot(
      startsAt,
      offering.durationMinutes.toMinutes()
    );
    if (!slotResult.isOk) return slotResult;

    const overlapResult = await this.bookingRepository.findOverlapping(
      resourceResult.data.id,
      slotResult.data.startsAt,
      slotResult.data.endsAt
    );
    if (!overlapResult.isOk) return overlapResult;
    if (overlapResult.data.length > 0) {
      return fail(new ConflictError('Resource is already booked for this time slot.'));
    }

    const entityResult = BookingEntity.create({
      customerId: userId,
      customerCode: userCode,
      customerName: userName,
      establishmentId: serviceResult.data.establishmentId,
      establishmentCode,
      serviceId: serviceResult.data.id,
      serviceCode,
      serviceName: serviceResult.data.name,
      resourceId: resourceResult.data.id,
      resourceCode,
      resourceName: resourceResult.data.name,
      startsAt: slotResult.data.startsAt,
      endsAt: slotResult.data.endsAt,
    });
    if (!entityResult.isOk) return entityResult;

    const saveResult = await this.bookingRepository.save(entityResult.data);
    if (!saveResult.isOk) return saveResult;

    return ok(BookingMapper.toDTO(saveResult.data));
  }
}
