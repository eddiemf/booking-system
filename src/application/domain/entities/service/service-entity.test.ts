import { ValidationError } from '@app/domain/errors';
import { ServiceEntity } from './service-entity';

describe('ServiceEntity', () => {
  describe('create()', () => {
    it('fails to create with empty name', () => {
      const error = ServiceEntity.create({ name: '', duration: 60 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('fails to create with duration less than zero', () => {
      const error = ServiceEntity.create({ name: 'service', duration: -1 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: duration. Value is required.');
    });

    it('fails to create with duration equal to zero', () => {
      const error = ServiceEntity.create({ name: 'service', duration: 0 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: duration. Value is required.');
    });

    it('creates a valid service with default description', () => {
      const data = ServiceEntity.create({ name: 'service', duration: 60 }).getData();

      expect(data).toBeInstanceOf(ServiceEntity);
      expect(data.description).toBe('');
    });

    it('creates a valid service with default ID', () => {
      const data = ServiceEntity.create({ name: 'service', duration: 60 }).getData();

      expect(data).toBeInstanceOf(ServiceEntity);
      expect(typeof data.id).toBe('string');
    });

    it('creates a valid service', () => {
      const data = ServiceEntity.create({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      }).getData();

      expect(data).toBeInstanceOf(ServiceEntity);
      expect(data.id).toBe('123');
      expect(data.name).toBe('service');
      expect(data.description).toBe('description');
      expect(data.duration).toBe(60);
    });
  });
});
