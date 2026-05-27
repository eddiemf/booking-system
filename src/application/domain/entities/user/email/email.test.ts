import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Email } from './email';

describe('Email', () => {
  describe('create()', () => {
    it('fails with empty string', () => {
      const error = Email.create('', 'email').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('fails with missing @', () => {
      const error = Email.create('notanemail', 'email').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('fails with missing domain', () => {
      const error = Email.create('user@', 'email').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('fails with missing local part', () => {
      const error = Email.create('@domain.com', 'email').getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('uses the provided field name in the error', () => {
      const error = Email.create('bad', 'myField').getError();

      expect(error.message).toContain('myField');
    });

    it('creates with a valid email', () => {
      const email = Email.create('alice@example.com', 'email').getData();

      expect(email.value).toBe('alice@example.com');
    });

    it('accepts subdomain addresses', () => {
      const email = Email.create('user@sub.example.com', 'email').getData();

      expect(email.value).toBe('user@sub.example.com');
    });
  });

  describe('from()', () => {
    it('constructs from a string without validation', () => {
      const email = Email.from('alice@example.com');

      expect(email.value).toBe('alice@example.com');
    });
  });

  describe('equals()', () => {
    it('returns true for the same email', () => {
      expect(Email.from('a@b.com').equals(Email.from('a@b.com'))).toBe(true);
    });

    it('returns false for different emails', () => {
      expect(Email.from('a@b.com').equals(Email.from('c@d.com'))).toBe(false);
    });

    it('is structural — two separate instances with the same value are equal', () => {
      const a = Email.from('x@y.com');
      const b = Email.from('x@y.com');

      expect(a).not.toBe(b);
      expect(a.equals(b)).toBe(true);
    });
  });
});