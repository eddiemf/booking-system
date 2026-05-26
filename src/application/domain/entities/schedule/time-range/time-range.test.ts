import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { TimeOfDay } from '../time-of-day/time-of-day';
import { TimeRange } from './time-range';

describe('TimeRange', () => {
  describe('create()', () => {
    it('fails when startTime has an invalid format', () => {
      const error = TimeRange.create('9:00', '17:00').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when endTime has an invalid format', () => {
      const error = TimeRange.create('09:00', '1700').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('fails when endTime equals startTime', () => {
      const error = TimeRange.create('09:00', '09:00').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('fails when endTime is before startTime', () => {
      const error = TimeRange.create('17:00', '09:00').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('creates with valid start and end times', () => {
      const range = TimeRange.create('09:00', '17:00').getData();

      expect(range.start.value).toBe('09:00');
      expect(range.end.value).toBe('17:00');
    });
  });

  describe('from()', () => {
    it('constructs from strings without validation', () => {
      const range = TimeRange.from('09:00', '17:00');

      expect(range.start.value).toBe('09:00');
      expect(range.end.value).toBe('17:00');
    });
  });

  describe('durationInMinutes()', () => {
    it('returns the length of the range in minutes', () => {
      expect(TimeRange.from('09:00', '17:00').durationInMinutes()).toBe(480);
      expect(TimeRange.from('09:00', '09:30').durationInMinutes()).toBe(30);
      expect(TimeRange.from('00:00', '23:59').durationInMinutes()).toBe(1439);
    });
  });

  describe('contains()', () => {
    const range = TimeRange.from('09:00', '17:00');

    it('returns true for a time inside the range', () => {
      expect(range.contains(TimeOfDay.from('12:00'))).toBe(true);
    });

    it('returns true for the start boundary', () => {
      expect(range.contains(TimeOfDay.from('09:00'))).toBe(true);
    });

    it('returns true for the end boundary', () => {
      expect(range.contains(TimeOfDay.from('17:00'))).toBe(true);
    });

    it('returns false for a time before the range', () => {
      expect(range.contains(TimeOfDay.from('08:59'))).toBe(false);
    });

    it('returns false for a time after the range', () => {
      expect(range.contains(TimeOfDay.from('17:01'))).toBe(false);
    });
  });

  describe('overlapsWith()', () => {
    const morning = TimeRange.from('09:00', '13:00');

    it('returns true for overlapping ranges', () => {
      expect(morning.overlapsWith(TimeRange.from('11:00', '15:00'))).toBe(true);
    });

    it('returns true when one range is fully inside the other', () => {
      expect(morning.overlapsWith(TimeRange.from('10:00', '12:00'))).toBe(true);
    });

    it('returns false for non-overlapping ranges', () => {
      expect(morning.overlapsWith(TimeRange.from('14:00', '18:00'))).toBe(false);
    });

    it('returns false for adjacent ranges (touching but not overlapping)', () => {
      expect(morning.overlapsWith(TimeRange.from('13:00', '17:00'))).toBe(false);
    });
  });

  describe('equals()', () => {
    it('returns true for the same start and end', () => {
      expect(TimeRange.from('09:00', '17:00').equals(TimeRange.from('09:00', '17:00'))).toBe(true);
    });

    it('returns false when start differs', () => {
      expect(TimeRange.from('09:00', '17:00').equals(TimeRange.from('10:00', '17:00'))).toBe(false);
    });

    it('returns false when end differs', () => {
      expect(TimeRange.from('09:00', '17:00').equals(TimeRange.from('09:00', '18:00'))).toBe(false);
    });

    it('is structural — two separate instances with the same values are equal', () => {
      const a = TimeRange.from('09:00', '17:00');
      const b = TimeRange.from('09:00', '17:00');

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
