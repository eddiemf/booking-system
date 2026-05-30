import { Resource } from '@app/domain/entities/resource/resource-entity';
import { Schedule } from '@app/domain/entities/schedule/schedule-entity';
import { ServiceOffering } from '@app/domain/entities/service-offering/service-offering-entity';
import { describe, expect, it } from 'vitest';
import { AvailabilityService } from './availability-service';

describe('AvailabilityService', () => {
  const service = new AvailabilityService();

  const buildResource = (schedules: Schedule[]) =>
    Resource.reconstruct({
      id: 'uuid-res',
      code: 'res123',
      name: 'Alice',
      establishmentId: 'uuid-est',
      establishmentCode: 'est123',
      schedules,
    });

  const buildOffering = (durationMinutes: number, slotIntervalMinutes: number) =>
    ServiceOffering.reconstruct({
      id: 'uuid-off',
      code: 'off1',
      serviceId: 'uuid-svc',
      resourceId: 'uuid-res',
      maxCapacity: 1,
      durationMinutes,
      slotIntervalMinutes,
      price: 0,
    });

  const buildSchedule = (dayOfWeek: number, start: string, end: string) =>
    Schedule.reconstruct({
      id: 'uuid-sch',
      code: 'sch1',
      resourceId: 'uuid-res',
      dayOfWeek,
      startTime: start,
      endTime: end,
    });

  // Wednesday
  const wednesday = '2026-06-03';

  describe('validateDate()', () => {
    it('returns ok for a valid future date', () => {
      const result = service.validateDate('2099-12-31');

      expect(result.isOk).toBe(true);
    });

    it('returns error for an invalid date string', () => {
      const result = service.validateDate('not-a-date');

      expect(result.isOk).toBe(false);
      expect(result.getError().message).toContain('date');
    });

    it('returns error for a past date', () => {
      const result = service.validateDate('2020-01-01');

      expect(result.isOk).toBe(false);
      expect(result.getError().message).toContain('past');
    });
  });

  describe('generateResourceSlots()', () => {
    it('returns empty when no schedules match the day of week', () => {
      const resource = buildResource([buildSchedule(1, '09:00', '17:00')]); // Monday
      const offering = buildOffering(60, 60);

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      expect(slots).toEqual([]);
    });

    it('generates slots for a single window at the correct interval', () => {
      const resource = buildResource([buildSchedule(3, '09:00', '12:00')]);
      const offering = buildOffering(60, 60);

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      expect(slots).toHaveLength(3);
      expect(slots[0]).toEqual({
        startTime: '09:00',
        endTime: '10:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      });
      expect(slots[1]).toEqual({
        startTime: '10:00',
        endTime: '11:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      });
      expect(slots[2]).toEqual({
        startTime: '11:00',
        endTime: '12:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      });
    });

    it('excludes slot when duration exceeds remaining window time', () => {
      const resource = buildResource([buildSchedule(3, '09:00', '10:30')]);
      const offering = buildOffering(60, 30);

      // starts: 09:00 → 09:00-10:00 ✓, 09:30 → 09:30-10:30 ✓, 10:00 → 10:00-11:00 ✗
      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      expect(slots).toHaveLength(2);
      expect(slots[0]?.startTime).toBe('09:00');
      expect(slots[1]?.startTime).toBe('09:30');
    });

    it('handles multiple windows (e.g. break in the middle)', () => {
      const resource = buildResource([
        buildSchedule(3, '09:00', '12:00'),
        buildSchedule(3, '13:00', '17:00'),
      ]);
      const offering = buildOffering(60, 60);

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      // morning: 09, 10, 11 → 3 slots. afternoon: 13, 14, 15, 16 → 4 slots. total = 7
      expect(slots).toHaveLength(7);
      expect(slots[0]?.startTime).toBe('09:00');
      expect(slots[3]?.startTime).toBe('13:00');
      expect(slots[6]?.startTime).toBe('16:00');
    });

    it('uses slotInterval when it differs from duration', () => {
      const resource = buildResource([buildSchedule(3, '09:00', '11:00')]);
      const offering = buildOffering(30, 15); // 30min blocks every 15min

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      // 09:00-09:30, 09:15-09:45, 09:30-10:00, 09:45-10:15, 10:00-10:30, 10:15-10:45, 10:30-11:00
      expect(slots).toHaveLength(7);
      expect(slots[0]).toEqual({
        startTime: '09:00',
        endTime: '09:30',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      });
      expect(slots[6]).toEqual({
        startTime: '10:30',
        endTime: '11:00',
        resourceCode: 'res123',
        resourceName: 'Alice',
        price: 0,
      });
    });

    it('returns correct resource code and name in each slot', () => {
      const resource = buildResource([buildSchedule(3, '10:00', '11:00')]);
      const offering = buildOffering(30, 30);

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
      });

      for (const slot of slots) {
        expect(slot.resourceCode).toBe('res123');
        expect(slot.resourceName).toBe('Alice');
      }
    });

    it('excludes slots that overlap with existing bookings', () => {
      const resource = buildResource([buildSchedule(3, '09:00', '12:00')]);
      const offering = buildOffering(60, 60);

      // Booking from 10:00 to 10:30 in local wall-clock minutes
      const bookings = [{ startMinutes: 600, endMinutes: 630 }]; // 10:00-10:30

      const slots = service.generateResourceSlots({
        date: wednesday,
        resource,
        offering,
        bookings,
      });

      // Without booking: 09:00, 10:00, 11:00 → 3 slots
      // With booking 10:00-10:30: 10:00 slot overlaps. Expected: 09:00, 11:00 → 2 slots
      expect(slots).toHaveLength(2);
      expect(slots[0]?.startTime).toBe('09:00');
      expect(slots[1]?.startTime).toBe('11:00');
    });
  });
});
