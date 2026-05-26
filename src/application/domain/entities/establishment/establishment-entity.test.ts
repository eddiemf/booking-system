import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { ResourceEntity } from '../resource/resource-entity';
import { ServiceEntity } from '../service/service-entity';
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

    it('starts with empty resources and services', () => {
      const entity = EstablishmentEntity.create({ name: 'My Salon' }).getData();

      expect(entity.resources).toEqual([]);
      expect(entity.services).toEqual([]);
    });
  });

  describe('reconstruct()', () => {
    it('defaults resources and services to empty arrays', () => {
      const entity = EstablishmentEntity.reconstruct({ id: '1', code: 'abc', name: 'Salon' });

      expect(entity.resources).toEqual([]);
      expect(entity.services).toEqual([]);
    });

    it('restores resources and services when provided', () => {
      const resource = ResourceEntity.reconstruct({
        id: 'r1',
        code: 'res1',
        name: 'Alice',
        establishmentId: '1',
      });
      const service = ServiceEntity.reconstruct({
        id: 's1',
        code: 'svc1',
        name: 'Haircut',
        description: '',
        duration: 60,
        establishmentId: '1',
      });
      const entity = EstablishmentEntity.reconstruct({
        id: '1',
        code: 'abc',
        name: 'Salon',
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
