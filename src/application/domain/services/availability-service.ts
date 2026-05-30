import { ValidationError } from '@app/domain/errors';
import { fail, ok, type Result } from '@shared/result';
import type { Resource } from '../entities/resource/resource-entity';
import { TimeOfDay } from '../entities/schedule/time-of-day/time-of-day';
import type { ServiceOffering } from '../entities/service-offering/service-offering-entity';

export interface ResourceSlot {
  startTime: string;
  endTime: string;
  resourceCode: string;
  resourceName: string;
  price: number;
}

/**
 * Pre-converted booking expressed as minutes-since-midnight
 * in the establishment's local time for the target date.
 */
export interface BookingMinutes {
  startMinutes: number;
  endMinutes: number;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export class AvailabilityService {
  /**
   * Validate that the given date string is a valid future date.
   */
  validateDate(date: string): Result<void, ValidationError> {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return fail(new ValidationError('date', 'Must be a valid date.'));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return fail(new ValidationError('date', 'Must not be in the past.'));
    }

    return ok(undefined);
  }

  /**
   * Compute the ISO endsAt from startsAt + durationMinutes.
   * Validates startsAt is a valid future ISO 8601 datetime.
   */
  resolveTimeSlot(
    startsAt: string,
    offering: ServiceOffering
  ): Result<{ startsAt: string; endsAt: string }, ValidationError> {
    const now = new Date();

    if (!ISO_DATE_REGEX.test(startsAt)) {
      return fail(new ValidationError('startsAt', 'Must be a valid ISO 8601 datetime string.'));
    }

    const startDate = new Date(startsAt);
    if (isNaN(startDate.getTime())) {
      return fail(new ValidationError('startsAt', 'Must be a valid date.'));
    }

    if (startDate <= now) {
      return fail(new ValidationError('startsAt', 'Must be in the future.'));
    }

    const endDate = new Date(startDate.getTime() + offering.duration.toMinutes() * 60000);

    return ok({ startsAt, endsAt: endDate.toISOString() });
  }

  /**
   * Generate available time slots for a resource + offering on a given date.
   *
   * Schedule windows come from resource.schedules (wall-clock times).
   * Bookings must be pre-converted to local wall-clock minutes via BookingMinutes.
   *
   * Pipeline:
   * 1. Filter schedules for the given dayOfWeek → get base windows
   * 2. For each window, generate grid start times at slotInterval granularity
   * 3. Filter out start times where the block (duration) would exceed the window end
   * 4. Filter out slots that overlap with existing bookings
   */
  generateResourceSlots({
    date,
    offering,
    resource,
    bookings = [],
  }: {
    date: string;
    resource: Resource;
    offering: ServiceOffering;
    bookings?: BookingMinutes[];
  }): ResourceSlot[] {
    const slots: ResourceSlot[] = [];
    const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
    const duration = offering.duration.toMinutes();
    const slotIntervalMinutes = offering.slotInterval.toMinutes();
    const resourceCode = resource.code;
    const resourceName = resource.name;
    const windows = resource.schedules.filter((schedule) => schedule.dayOfWeek.value === dayOfWeek);

    for (const window of windows) {
      const windowStart = window.timeRange.start.toMinutes();
      const windowEnd = window.timeRange.end.toMinutes();

      for (let time = windowStart; time + duration <= windowEnd; time += slotIntervalMinutes) {
        const slotStart = time;
        const slotEnd = time + duration;

        if (this.isOverlapping(bookings, slotStart, slotEnd)) continue;

        slots.push({
          startTime: TimeOfDay.fromMinutes(slotStart).value,
          endTime: TimeOfDay.fromMinutes(slotEnd).value,
          resourceCode,
          resourceName,
          price: offering.price.value,
        });
      }
    }

    return slots;
  }

  private isOverlapping(bookings: BookingMinutes[], slotStart: number, slotEnd: number): boolean {
    return bookings.some(
      (booking) => slotStart < booking.endMinutes && slotEnd > booking.startMinutes
    );
  }
}
