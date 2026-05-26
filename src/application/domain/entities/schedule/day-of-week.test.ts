import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { DayOfWeek } from './day-of-week';

describe('DayOfWeek', () => {
  describe('create()', () => {
    it('fails with a negative value', () => {
      const error = DayOfWeek.create(-1, 'dayOfWeek').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('dayOfWeek');
    });

    it('fails with a value greater than 6', () => {
      const error = DayOfWeek.create(7, 'dayOfWeek').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('fails with a non-integer value', () => {
      const error = DayOfWeek.create(1.5, 'dayOfWeek').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('creates with value 0 (Sunday)', () => {
      const day = DayOfWeek.create(0, 'dayOfWeek').getData();

      expect(day.value).toBe(0);
    });

    it('creates with value 6 (Saturday)', () => {
      const day = DayOfWeek.create(6, 'dayOfWeek').getData();

      expect(day.value).toBe(6);
    });
  });

  describe('from()', () => {
    it('constructs from a number without validation', () => {
      const day = DayOfWeek.from(3);

      expect(day.value).toBe(3);
    });
  });

  describe('label()', () => {
    it('returns the correct day name for each value', () => {
      expect(DayOfWeek.from(0).label()).toBe('Sunday');
      expect(DayOfWeek.from(1).label()).toBe('Monday');
      expect(DayOfWeek.from(2).label()).toBe('Tuesday');
      expect(DayOfWeek.from(3).label()).toBe('Wednesday');
      expect(DayOfWeek.from(4).label()).toBe('Thursday');
      expect(DayOfWeek.from(5).label()).toBe('Friday');
      expect(DayOfWeek.from(6).label()).toBe('Saturday');
    });
  });

  describe('isWeekend()', () => {
    it('returns true for Sunday (0)', () => {
      expect(DayOfWeek.from(0).isWeekend()).toBe(true);
    });

    it('returns true for Saturday (6)', () => {
      expect(DayOfWeek.from(6).isWeekend()).toBe(true);
    });

    it('returns false for weekdays', () => {
      expect(DayOfWeek.from(1).isWeekend()).toBe(false);
      expect(DayOfWeek.from(2).isWeekend()).toBe(false);
      expect(DayOfWeek.from(5).isWeekend()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('returns true for the same day', () => {
      expect(DayOfWeek.from(1).equals(DayOfWeek.from(1))).toBe(true);
    });

    it('returns false for different days', () => {
      expect(DayOfWeek.from(1).equals(DayOfWeek.from(2))).toBe(false);
    });

    it('is structural — two separate instances with the same value are equal', () => {
      const a = DayOfWeek.from(3);
      const b = DayOfWeek.from(3);

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
