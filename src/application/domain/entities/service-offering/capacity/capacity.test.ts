import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Capacity } from './capacity';

describe('Capacity', () => {
  describe('create()', () => {
    it('fails with a value of zero', () => {
      const error = Capacity.create(0, 'maxCapacity').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('maxCapacity');
    });

    it('fails with a negative value', () => {
      const error = Capacity.create(-1, 'maxCapacity').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('fails with a non-integer value', () => {
      const error = Capacity.create(1.5, 'maxCapacity').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('uses the provided field name in the error', () => {
      const error = Capacity.create(0, 'myField').getError();

      expect(error.message).toContain('myField');
    });

    it('creates with a positive integer value', () => {
      const capacity = Capacity.create(1, 'maxCapacity').getData();

      expect(capacity.value).toBe(1);
    });

    it('creates with a capacity of 20 (shared use)', () => {
      const capacity = Capacity.create(20, 'maxCapacity').getData();

      expect(capacity.value).toBe(20);
    });
  });

  describe('from()', () => {
    it('constructs from a number without validation', () => {
      const capacity = Capacity.from(5);

      expect(capacity.value).toBe(5);
    });
  });

  describe('equals()', () => {
    it('returns true for the same capacity', () => {
      expect(Capacity.from(1).equals(Capacity.from(1))).toBe(true);
    });

    it('returns false for different capacities', () => {
      expect(Capacity.from(1).equals(Capacity.from(5))).toBe(false);
    });

    it('is structural — two separate instances with the same value are equal', () => {
      const a = Capacity.from(3);
      const b = Capacity.from(3);

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
