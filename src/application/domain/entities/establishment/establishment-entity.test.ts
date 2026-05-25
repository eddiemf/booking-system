import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { EstablishmentEntity } from './establishment-entity';

describe('EstablishmentEntity', () => {
  describe('create()', () => {
    it('fails to create with empty name', () => {
      const error = EstablishmentEntity.create({ name: '' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('creates a valid establishment', () => {
      const data = EstablishmentEntity.create({ name: 'My Salon' }).getData();

      expect(data).toBeInstanceOf(EstablishmentEntity);
      expect(data.name).toBe('My Salon');
      expect(typeof data.id).toBe('string');
    });
  });
});
