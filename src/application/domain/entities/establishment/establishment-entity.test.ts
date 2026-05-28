import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { Resource } from '../resource/resource-entity';
import { Service } from '../service/service-entity';
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

    it('starts with empty resources and services', () => {
      const entity = Establishment.create({
        name: 'My Salon',
        userId: 'uuid-user',
      }).getData();

      expect(entity.resources).toEqual([]);
      expect(entity.services).toEqual([]);
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
      expect(updatedEstablishment.resources).toEqual(establishment.resources);
      expect(updatedEstablishment.services).toEqual(establishment.services);
    });
  });

  describe('reconstruct()', () => {
    it('defaults resources and services to empty arrays', () => {
      const entity = Establishment.reconstruct({
        id: '1',
        code: 'abc',
        name: 'Salon',
        userId: 'uuid-user',
      });

      expect(entity.resources).toEqual([]);
      expect(entity.services).toEqual([]);
    });

    it('restores resources and services when provided', () => {
      const resource = Resource.reconstruct({
        id: 'r1',
        code: 'res1',
        name: 'Alice',
        establishmentId: '1',
        establishmentCode: 'est123',
      });
      const service = Service.reconstruct({
        id: 's1',
        code: 'svc1',
        name: 'Haircut',
        description: '',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      });
      const entity = Establishment.reconstruct({
        id: '1',
        code: 'abc',
        name: 'Salon',
        userId: 'uuid-user',
        resources: [resource],
        services: [service],
      });

      expect(entity.resources).toHaveLength(1);
      expect(entity.resources[0]).toBe(resource);
      expect(entity.services).toHaveLength(1);
      expect(entity.services[0]).toBe(service);
    });
  });
});
