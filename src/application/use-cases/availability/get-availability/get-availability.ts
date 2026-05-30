import type {
  Booking,
  BookingRepository,
  EstablishmentRepository,
  ResourceRepository,
  ServiceOffering,
  ServiceOfferingRepository,
} from '@app/domain/entities';
import type { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilityService, BookingMinutes } from '@app/domain/services';
import { ok, type PromiseResult } from '@shared/result';
import { DateTime } from 'luxon';
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
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly availabilityService: AvailabilityService
  ) {}

  async execute({
    serviceCode,
    establishmentCode,
    date,
  }: Input): PromiseResult<AvailabilitySlotDTO[], GetAvailabilityError | ValidationError> {
    const dateValidation = this.availabilityService.validateDate(date);
    if (!dateValidation.isOk) return dateValidation;

    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;

    const establishment = establishmentResult.data;
    if (!establishment) return ok([]);

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
    const timezone = establishment.timezone;

    const bookingsByResourceId = this.makeBookingsByResourceId(bookings, date, timezone);

    const offeringByResourceId = this.makeOfferingsByResourceId(offerings);

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

  private makeBookingsByResourceId(
    bookings: Booking[],
    date: string,
    timezone: string
  ): Map<string, BookingMinutes[]> {
    const bookingsByResourceId = new Map<string, BookingMinutes[]>();

    for (const booking of bookings) {
      // Pre-convert bookings to local wall-clock minutes for the target date
      const bookingMinutes = this.toBookingMinutes(booking, date, timezone);
      if (!bookingMinutes) continue;

      const existing = bookingsByResourceId.get(booking.resourceId);
      if (!existing) {
        bookingsByResourceId.set(booking.resourceId, [bookingMinutes]);
        continue;
      }

      existing.push(bookingMinutes);
    }

    return bookingsByResourceId;
  }

  /**
   * Convert a UTC booking ISO string to local wall-clock minutes
   * on the target date.
   *
   * Returns null if the booking does not overlap the target date at all.
   * Handles midnight crossovers by clamping to [0, 1439].
   */
  private toBookingMinutes(
    booking: Booking,
    date: string,
    timezone: string
  ): BookingMinutes | null {
    const bookingStart = DateTime.fromISO(booking.startsAt, { zone: 'utc' }).setZone(timezone);
    const bookingEnd = DateTime.fromISO(booking.endsAt, { zone: 'utc' }).setZone(timezone);

    const targetDate = DateTime.fromISO(date, { zone: timezone });

    const startOnTarget = bookingStart.hasSame(targetDate, 'day');
    const endOnTarget = bookingEnd.hasSame(targetDate, 'day');

    // Booking does not overlap target date at all
    if (!startOnTarget && !endOnTarget) {
      const beforeTarget = bookingStart < targetDate;
      const afterTarget = bookingStart > targetDate;

      if (beforeTarget && bookingEnd < targetDate) return null;
      if (afterTarget) return null;
    }

    // Compute start: 0 if booking started before target date, otherwise local minutes
    const startMinutes = startOnTarget ? bookingStart.hour * 60 + bookingStart.minute : 0;

    // Compute end: 1439 if booking ends after target date, otherwise local minutes
    const endMinutes = endOnTarget ? bookingEnd.hour * 60 + bookingEnd.minute : 1439;

    return { startMinutes, endMinutes };
  }
}
