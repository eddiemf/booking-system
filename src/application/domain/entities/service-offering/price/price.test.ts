import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Price } from './price';

describe('Price', () => {
  describe('create()', () => {
    it('fails with a negative value', () => {
      const error = Price.create(-1, 'price').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('price');
    });

    it('fails with a non-integer value', () => {
      const error = Price.create(1.5, 'price').getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('uses the provided field name in the error', () => {
      const error = Price.create(-10, 'myField').getError();

      expect(error.message).toContain('myField');
    });

    it('creates with zero (free)', () => {
      const price = Price.create(0, 'price').getData();

      expect(price.value).toBe(0);
    });

    it('creates with a positive integer value', () => {
      const price = Price.create(5000, 'price').getData();

      expect(price.value).toBe(5000);
    });
  });

  describe('from()', () => {
    it('constructs from a number without validation', () => {
      const price = Price.from(3000);

      expect(price.value).toBe(3000);
    });
  });

  describe('equals()', () => {
    it('returns true for the same price', () => {
      expect(Price.from(1000).equals(Price.from(1000))).toBe(true);
    });

    it('returns false for different prices', () => {
      expect(Price.from(1000).equals(Price.from(2000))).toBe(false);
    });

    it('is structural', () => {
      const a = Price.from(2500);
      const b = Price.from(2500);

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});
