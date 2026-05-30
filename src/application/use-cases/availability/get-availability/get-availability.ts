import type {
  Booking,
  BookingRepository,
  ResourceRepository,
  ServiceOffering,
  ServiceOfferingRepository,
} from '@app/domain/entities';
import type { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilityService } from '@app/domain/services';
import { ok, type PromiseResult } from '@shared/result';
import type { AvailabilitySlotDTO } from '../../../dtos';

type Input = {
  serviceCode: string;
  establishmentCode: string;
  date: string; // YYYY-MM-DD
};

type GetAvailabilityError = StorageError | NotFoundError;

export class GetAvailability {
  constructor(
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly availabilityService: AvailabilityService
  ) {}

  async execute({
    serviceCode,
    establishmentCode,
    date,
  }: Input): PromiseResult<AvailabilitySlotDTO[], GetAvailabilityError | ValidationError> {
    const dateValidation = this.availabilityService.validateDate(date);
    if (!dateValidation.isOk) return dateValidation;

    const offeringsResult = await this.serviceOfferingRepository.getByServiceCode(
      serviceCode,
      establishmentCode
    );
    if (!offeringsResult.isOk) return offeringsResult;

    const offerings = offeringsResult.data;
    if (offerings.length === 0) return ok([]);

    const resourceIds = offerings.map((offering) => offering.resourceId);

    const [resourcesResult, bookingsResult] = await Promise.all([
      this.resourceRepository.getByIds(resourceIds, establishmentCode),
      this.bookingRepository.getByResourcesAndDate(resourceIds, date),
    ]);
    if (!resourcesResult.isOk) return resourcesResult;
    if (!bookingsResult.isOk) return bookingsResult;

    const resources = resourcesResult.data;
    const bookings = bookingsResult.data;

    const offeringByResourceId = this.makeOfferingsByResourceId(offerings);
    const bookingsByResourceId = this.makeBookingsByResourceId(bookings);

    const slots: AvailabilitySlotDTO[] = [];

    for (const resource of resources) {
      const offering = offeringByResourceId.get(resource.id);
      if (!offering) continue;

      const resourceSlots = this.availabilityService.generateResourceSlots({
        date,
        resource,
        offering,
        bookings: bookingsByResourceId.get(resource.id) ?? [],
      });

      slots.push(...resourceSlots);
    }

    return ok(slots);
  }

  private makeOfferingsByResourceId(offerings: ServiceOffering[]): Map<string, ServiceOffering> {
    return new Map(offerings.map((offering) => [offering.resourceId, offering]));
  }

  private makeBookingsByResourceId(bookings: Booking[]): Map<string, Booking[]> {
    const bookingsByResourceId = new Map<string, Booking[]>();

    for (const booking of bookings) {
      const existing = bookingsByResourceId.get(booking.resourceId);
      if (!existing) {
        bookingsByResourceId.set(booking.resourceId, [booking]);
        continue;
      }

      existing.push(booking);
    }

    return bookingsByResourceId;
  }
}
