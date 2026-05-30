import {
  Booking,
  type BookingRepository,
  type EstablishmentRepository,
  type ResourceRepository,
  type ServiceOfferingRepository,
  type ServiceRepository,
} from '@app/domain/entities';
import {
  ConflictError,
  NotFoundError,
  type StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { fail, ok, type PromiseResult } from '@shared/result';
import { DateTime } from 'luxon';
import type { BookingDTO } from '../../../dtos';
import { BookingMapper } from '../../../mappers/booking';

interface Input {
  serviceCode: string;
  resourceCode: string;
  establishmentCode: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (local time at establishment)
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
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly availabilityService: AvailabilityService
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    date,
    startTime,
    userId,
    userCode,
    userName,
  }: Input): PromiseResult<BookingDTO, CreateBookingError> {
    const [serviceResult, resourceResult, offeringsResult, establishmentResult] = await Promise.all(
      [
        this.serviceRepository.findByCode(serviceCode, establishmentCode),
        this.resourceRepository.findByCode(resourceCode),
        this.serviceOfferingRepository.getByServiceCode(serviceCode, establishmentCode),
        this.establishmentRepository.findByCode(establishmentCode),
      ]
    );

    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;
    if (!offeringsResult.isOk) return offeringsResult;
    if (!establishmentResult.isOk) return establishmentResult;

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', serviceCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));
    if (resource.establishmentCode !== establishmentCode) {
      return fail(new NotFoundError('Resource', resourceCode));
    }

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

    const offerings = offeringsResult.data;
    const offering = offerings.find((offering) => offering.resourceId === resource.id);
    if (!offering) return fail(new NotFoundError('Resource', resourceCode));

    // Convert local date + startTime to UTC ISO using establishment timezone
    const localStart = DateTime.fromISO(`${date}T${startTime}:00`, {
      zone: establishment.timezone,
    });
    if (!localStart.isValid) {
      return fail(
        new ValidationError(
          'startTime',
          `Invalid date/time combination for timezone "${establishment.timezone}".`
        )
      );
    }

    const startsAt = localStart.toUTC().toISO();
    if (!startsAt) {
      return fail(new ValidationError('startTime', 'Failed to convert to UTC.'));
    }

    const slotResult = this.availabilityService.resolveTimeSlot(startsAt, offering);
    if (!slotResult.isOk) return slotResult;

    const slot = slotResult.data;
    const overlapResult = await this.bookingRepository.getOverlapping(
      resource.id,
      slot.startsAt,
      slot.endsAt
    );
    if (!overlapResult.isOk) return overlapResult;

    const overlappingBookings = overlapResult.data;
    if (overlappingBookings.length > 0) {
      return fail(new ConflictError('Resource is already booked for this time slot.'));
    }

    const entityResult = Booking.create({
      customerId: userId,
      customerCode: userCode,
      customerName: userName,
      establishmentId: service.establishmentId,
      establishmentCode,
      serviceId: service.id,
      serviceCode,
      serviceName: service.name,
      resourceId: resource.id,
      resourceCode,
      resourceName: resource.name,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      servicePrice: offering.price.value,
      serviceDuration: offering.duration.toMinutes(),
    });
    if (!entityResult.isOk) return entityResult;

    const saveResult = await this.bookingRepository.save(entityResult.data);
    if (!saveResult.isOk) return saveResult;

    return ok(BookingMapper.toDTO(entityResult.data));
  }
}
