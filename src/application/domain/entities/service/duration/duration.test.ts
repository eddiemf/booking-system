import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Duration } from './duration';

describe('Duration', () => {
  describe('create()', () => {
    it('fails with a value of zero', () => {
      const error = Duration.create(0, 'duration').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(
        'Invalid value for field: duration. Value must be greater than 0.'
      );
    });

    it('fails with a negative value', () => {
      const error = Duration.create(-10, 'duration').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('uses the provided field name in the error', () => {
      const error = Duration.create(0, 'myField').getError();

      expect(error.message).toContain('myField');
    });

    it('creates with a positive value', () => {
      const duration = Duration.create(30, 'duration').getData();

      expect(duration.value).toBe(30);
    });
  });

  describe('from()', () => {
    it('constructs from a number without validation', () => {
      const duration = Duration.from(90);

      expect(duration.value).toBe(90);
    });
  });

  describe('toMinutes()', () => {
    it('returns the duration in minutes', () => {
      expect(Duration.from(30).toMinutes()).toBe(30);
      expect(Duration.from(90).toMinutes()).toBe(90);
    });
  });

  describe('toHours()', () => {
    it('converts whole minutes to hours', () => {
      expect(Duration.from(60).toHours()).toBe(1);
    });

    it('handles fractional hours', () => {
      expect(Duration.from(90).toHours()).toBe(1.5);
      expect(Duration.from(30).toHours()).toBe(0.5);
    });
  });

  describe('equals()', () => {
    it('returns true for the same duration', () => {
      expect(Duration.from(60).equals(Duration.from(60))).toBe(true);
    });

    it('returns false for different durations', () => {
      expect(Duration.from(60).equals(Duration.from(30))).toBe(false);
    });

    it('is structural — two separate instances with the same value are equal', () => {
      const a = Duration.from(60);
      const b = Duration.from(60);

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
