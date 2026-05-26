import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { ServiceEntity } from './service-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('ServiceEntity', () => {
  describe('create()', () => {
    it('fails to create with empty name', () => {
      const error = ServiceEntity.create({
        name: '',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('fails to create with duration less than zero', () => {
      const error = ServiceEntity.create({
        name: 'service',
        duration: -1,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(
        'Invalid value for field: duration. Value must be greater than 0.'
      );
    });

    it('fails to create with duration equal to zero', () => {
      const error = ServiceEntity.create({
        name: 'service',
        duration: 0,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(
        'Invalid value for field: duration. Value must be greater than 0.'
      );
    });

    it('creates a valid service with default description', () => {
      const service = ServiceEntity.create({
        name: 'service',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(service).toBeInstanceOf(ServiceEntity);
      expect(service.description).toBe('');
    });

    it('creates a valid service with all properties set', () => {
      const service = ServiceEntity.create({
        name: 'haircut',
        description: 'A basic haircut',
        duration: 30,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(service.name).toBe('haircut');
      expect(service.description).toBe('A basic haircut');
      expect(service.duration.toMinutes()).toBe(30);
      expect(service.establishmentId).toBe('1');
    });

    it('generates a UUIDv7 id', () => {
      const service = ServiceEntity.create({
        name: 'service',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(service.id).toMatch(UUID_V7_REGEX);
    });

    it('generates a unique id per instance', () => {
      const a = ServiceEntity.create({
        name: 'service',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();
      const b = ServiceEntity.create({
        name: 'service',
        duration: 60,
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(a.id).not.toBe(b.id);
    });
  });

  describe('reconstruct()', () => {
    it('restores all properties from the given data', () => {
      const service = ServiceEntity.reconstruct({
        id: 'id',
        code: 'svc123',
        name: 'massage',
        description: 'Haircut',
        duration: 90,
        establishmentId: '1',
        establishmentCode: 'est123',
      });

      expect(service).toBeInstanceOf(ServiceEntity);
      expect(service.id).toBe('id');
      expect(service.code).toBe('svc123');
      expect(service.name).toBe('massage');
      expect(service.description).toBe('Haircut');
      expect(service.duration.toMinutes()).toBe(90);
      expect(service.establishmentId).toBe('1');
    });
  });

  describe('update()', () => {
    const service = ServiceEntity.reconstruct({
      id: 'uuid-svc',
      code: 'svc123',
      name: 'Old Name',
      description: 'Old description',
      duration: 30,
      establishmentId: '5',
      establishmentCode: 'est123',
    });

    it('fails with empty name', () => {
      const error = service.update({ name: '', duration: 30 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('fails with invalid duration', () => {
      const error = service.update({ name: 'Haircut', duration: 0 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(
        'Invalid value for field: duration. Value must be greater than 0.'
      );
    });

    it('mutates the entity in place and returns it with updated fields', () => {
      const updatedService = service
        .update({
          name: 'Haircut',
          description: 'Updated',
          duration: 60,
        })
        .getData();

      expect(updatedService.name).toBe('Haircut');
      expect(updatedService.description).toBe('Updated');
      expect(updatedService.duration.toMinutes()).toBe(60);
      expect(updatedService.id).toBe(service.id);
      expect(updatedService.code).toBe(service.code);
      expect(updatedService.establishmentId).toBe(service.establishmentId);
    });
  });
});
