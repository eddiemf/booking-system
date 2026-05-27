import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { UserEntity } from './user-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('UserEntity', () => {
  describe('create()', () => {
    it('fails with empty email', () => {
      const error = UserEntity.create({ email: '', name: 'Alice' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('fails with invalid email format', () => {
      const error = UserEntity.create({ email: 'not-an-email', name: 'Alice' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('email');
    });

    it('fails with empty name', () => {
      const error = UserEntity.create({ email: 'alice@example.com', name: '' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('name');
    });

    it('creates a valid user', () => {
      const user = UserEntity.create({ email: 'alice@example.com', name: 'Alice' }).getData();

      expect(user).toBeInstanceOf(UserEntity);
      expect(user.email.value).toBe('alice@example.com');
      expect(user.name).toBe('Alice');
      expect(user.id).toMatch(UUID_V7_REGEX);
    });

    it('generates a unique id per instance', () => {
      const a = UserEntity.create({ email: 'a@example.com', name: 'A' }).getData();
      const b = UserEntity.create({ email: 'b@example.com', name: 'B' }).getData();

      expect(a.id).not.toBe(b.id);
    });

    it('generates a code', () => {
      const user = UserEntity.create({ email: 'alice@example.com', name: 'Alice' }).getData();

      expect(user.code).toBeDefined();
      expect(user.code.length).toBe(10);
    });
  });

  describe('reconstruct()', () => {
    it('restores all properties from the given data', () => {
      const user = UserEntity.reconstruct({
        id: 'uuid-1',
        code: 'usr12345',
        email: 'bob@example.com',
        name: 'Bob',
      });

      expect(user.id).toBe('uuid-1');
      expect(user.code).toBe('usr12345');
      expect(user.email.value).toBe('bob@example.com');
      expect(user.name).toBe('Bob');
    });
  });
});
