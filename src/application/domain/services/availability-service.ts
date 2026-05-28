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
    if (!ISO_DATE_REGEX.test(startsAt)) {
      return fail(new ValidationError('startsAt', 'Must be a valid ISO 8601 datetime string.'));
    }

    const startDate = new Date(startsAt);
    if (isNaN(startDate.getTime())) {
      return fail(new ValidationError('startsAt', 'Must be a valid date.'));
    }

    if (startDate <= new Date()) {
      return fail(new ValidationError('startsAt', 'Must be in the future.'));
    }

    const endDate = new Date(startDate.getTime() + offering.durationMinutes.toMinutes() * 60000);

    return ok({ startsAt, endsAt: endDate.toISOString() });
  }

  /**
   * Generate available time slots for a resource + offering on a given date.
   *
   * Pipeline:
   * 1. Filter schedules for the given dayOfWeek → get base windows
   * 2. For each window, generate grid start times at slotInterval granularity
   * 3. Filter out start times where the block (duration) would exceed the window end
   */
  generateResourceSlots({
    date,
    offering,
    resource,
  }: {
    date: string;
    resource: Resource;
    offering: ServiceOffering;
  }): ResourceSlot[] {
    const slots: ResourceSlot[] = [];
    const dayOfWeek = new Date(date).getDay();
    const durationMinutes = offering.durationMinutes.toMinutes();
    const slotIntervalMinutes = offering.slotIntervalMinutes.toMinutes();
    const resourceCode = resource.code;
    const resourceName = resource.name;

    const windows = resource.schedules.filter((schedule) => schedule.dayOfWeek.value === dayOfWeek);

    for (const window of windows) {
      const windowStart = window.timeRange.start.toMinutes();
      const windowEnd = window.timeRange.end.toMinutes();

      for (
        let time = windowStart;
        time + durationMinutes <= windowEnd;
        time += slotIntervalMinutes
      ) {
        slots.push({
          startTime: TimeOfDay.fromMinutes(time).value,
          endTime: TimeOfDay.fromMinutes(time + durationMinutes).value,
          resourceCode,
          resourceName,
          price: offering.price.value,
        });
      }
    }

    return slots;
  }
}
