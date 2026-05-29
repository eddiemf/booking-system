import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Establishment } from './establishment-entity';

describe('EstablishmentEntity', () => {
  describe('create()', () => {
    it('fails to create with empty name', () => {
      const error = Establishment.create({ name: '', userId: 'uuid-user' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('creates a valid establishment', () => {
      const data = Establishment.create({ name: 'My Salon', userId: 'uuid-user' }).getData();

      expect(data).toBeInstanceOf(Establishment);
      expect(data.name).toBe('My Salon');
      expect(data.userId).toBe('uuid-user');
      expect(typeof data.id).toBe('string');
    });
  });

  describe('update()', () => {
    const establishment = Establishment.reconstruct({
      id: 'uuid-1',
      code: 'abc123',
      name: 'Old Name',
      userId: 'uuid-user',
    });

    it('fails with empty name', () => {
      const error = establishment.update({ name: '' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('mutates the entity in place and returns it', () => {
      const updatedEstablishment = establishment.update({ name: 'New Name' }).getData();

      expect(updatedEstablishment.name).toBe('New Name');
      expect(updatedEstablishment.id).toBe(establishment.id);
      expect(updatedEstablishment.code).toBe(establishment.code);
      expect(updatedEstablishment.userId).toBe(establishment.userId);
    });
  });
});
