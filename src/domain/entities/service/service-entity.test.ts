import { ServiceEntity } from './service-entity';
import { ValidationError } from '@domain/errors';

describe('ServiceEntity', () => {
  describe('create()', () => {
    const expectedFailMessage = 'Expected an error, but got a valid service entity.';
    const expectedSuccessMessage = 'Expected a valid service entity, but got an error.';

    it('fails to create with empty name', () => {
      const result = ServiceEntity.create({
        name: '',
        duration: 60,
      });

      if (result.isOk) throw new Error(expectedFailMessage);

      expect(result.isOk).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('fails to create with duration less than zero', () => {
      const result = ServiceEntity.create({
        name: 'service',
        duration: -1,
      });

      if (result.isOk) throw new Error(expectedFailMessage);

      expect(result.isOk).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toBe('Invalid value for field: duration. Value is required.');
    });

    it('fails to create with duration equal to zero', () => {
      const result = ServiceEntity.create({
        name: 'service',
        duration: 0,
      });

      if (result.isOk) throw new Error(expectedFailMessage);

      expect(result.isOk).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toBe('Invalid value for field: duration. Value is required.');
    });

    it('creates a valid service with default description', () => {
      const result = ServiceEntity.create({
        name: 'service',
        duration: 60,
      });

      if (!result.isOk) throw new Error(expectedSuccessMessage);

      expect(result.isOk).toBe(true);
      expect(result.data).toBeInstanceOf(ServiceEntity);
      expect(result.data.getDescription()).toBe('');
    });

    it('creates a valid service with default ID', () => {
      const result = ServiceEntity.create({
        name: 'service',
        duration: 60,
      });

      if (!result.isOk) throw new Error(expectedSuccessMessage);

      expect(result.isOk).toBe(true);
      expect(result.data).toBeInstanceOf(ServiceEntity);
      expect(typeof result.data.getId()).toBe('string');
    });

    it('creates a valid service', () => {
      const result = ServiceEntity.create({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      });

      if (!result.isOk) throw new Error(expectedSuccessMessage);

      expect(result.isOk).toBe(true);
      expect(result.data).toBeInstanceOf(ServiceEntity);
      expect(result.data.getId()).toBe('123');
      expect(result.data.getName()).toBe('service');
      expect(result.data.getDescription()).toBe('description');
      expect(result.data.getDuration()).toBe(60);
    });
  });
});
