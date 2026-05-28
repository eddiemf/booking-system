import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { TimeOfDay } from './time-of-day';

describe('TimeOfDay', () => {
  describe('create()', () => {
    it('fails when format is missing leading zero', () => {
      const error = TimeOfDay.create('9:00', 'startTime').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when hours are out of range', () => {
      const error = TimeOfDay.create('25:00', 'startTime').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when minutes are out of range', () => {
      const error = TimeOfDay.create('09:60', 'startTime').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when format has no colon', () => {
      const error = TimeOfDay.create('0900', 'endTime').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('creates successfully for a valid time', () => {
      const time = TimeOfDay.create('09:00', 'startTime').getData();

      expect(time.value).toBe('09:00');
    });

    it('accepts boundary values 00:00 and 23:59', () => {
      expect(TimeOfDay.create('00:00', 'startTime').getData().value).toBe('00:00');
      expect(TimeOfDay.create('23:59', 'startTime').getData().value).toBe('23:59');
    });

    it('uses the provided field name in the error message', () => {
      const error = TimeOfDay.create('bad', 'endTime').getError();

      expect(error.message).toContain('endTime');
    });
  });

  describe('from()', () => {
    it('constructs from a string without validation', () => {
      const time = TimeOfDay.from('14:30');

      expect(time.value).toBe('14:30');
    });
  });

  describe('fromMinutes()', () => {
    it('converts 0 to 00:00', () => {
      const time = TimeOfDay.fromMinutes(0);

      expect(time.value).toBe('00:00');
      expect(time.toMinutes()).toBe(0);
    });

    it('converts 60 to 01:00', () => {
      const time = TimeOfDay.fromMinutes(60);

      expect(time.value).toBe('01:00');
      expect(time.toMinutes()).toBe(60);
    });

    it('converts 570 to 09:30', () => {
      const time = TimeOfDay.fromMinutes(570);

      expect(time.value).toBe('09:30');
      expect(time.toMinutes()).toBe(570);
    });

    it('converts 1439 to 23:59', () => {
      const time = TimeOfDay.fromMinutes(1439);

      expect(time.value).toBe('23:59');
      expect(time.toMinutes()).toBe(1439);
    });

    it('pads single-digit hours and minutes', () => {
      const time = TimeOfDay.fromMinutes(7);

      expect(time.value).toBe('00:07');
    });
  });

  describe('toMinutes()', () => {
    it('converts HH:MM to total minutes', () => {
      expect(TimeOfDay.from('00:00').toMinutes()).toBe(0);
      expect(TimeOfDay.from('01:00').toMinutes()).toBe(60);
      expect(TimeOfDay.from('09:30').toMinutes()).toBe(570);
      expect(TimeOfDay.from('23:59').toMinutes()).toBe(1439);
    });
  });

  describe('isAfter()', () => {
    it('returns true when this time is later', () => {
      const earlier = TimeOfDay.from('09:00');
      const later = TimeOfDay.from('17:00');

      expect(later.isAfter(earlier)).toBe(true);
    });

    it('returns false when this time is earlier', () => {
      const earlier = TimeOfDay.from('09:00');
      const later = TimeOfDay.from('17:00');

      expect(earlier.isAfter(later)).toBe(false);
    });

    it('returns false when both times are equal', () => {
      const a = TimeOfDay.from('09:00');
      const b = TimeOfDay.from('09:00');

      expect(a.isAfter(b)).toBe(false);
    });
  });

  describe('equals()', () => {
    it('returns true when both times represent the same value', () => {
      const a = TimeOfDay.from('09:00');
      const b = TimeOfDay.from('09:00');

      expect(a.equals(b)).toBe(true);
    });

    it('returns false when times differ', () => {
      const a = TimeOfDay.from('09:00');
      const b = TimeOfDay.from('10:00');

      expect(a.equals(b)).toBe(false);
    });

    it('is not reference equality — two separate instances with the same value are equal', () => {
      const a = TimeOfDay.from('12:00');
      const b = TimeOfDay.from('12:00');

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
