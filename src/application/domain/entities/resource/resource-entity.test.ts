import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { ResourceEntity } from './resource-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('ResourceEntity', () => {
  describe('create()', () => {
    it('fails with empty name', () => {
      const error = ResourceEntity.create({
        name: '',
        type: 'employee',
        establishmentId: '1',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('fails with invalid type', () => {
      const error = ResourceEntity.create({
        name: 'Room A',
        type: 'invalid' as never,
        establishmentId: '1',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: type. Must be employee or room.');
    });

    it('creates with type employee', () => {
      const entity = ResourceEntity.create({
        name: 'Alice',
        type: 'employee',
        establishmentId: '1',
      }).getData();

      expect(entity).toBeInstanceOf(ResourceEntity);
      expect(entity.type).toBe('employee');
      expect(entity.establishmentId).toBe('1');
    });

    it('creates with type room', () => {
      const entity = ResourceEntity.create({
        name: 'Room A',
        type: 'room',
        establishmentId: '1',
      }).getData();

      expect(entity.type).toBe('room');
    });

    it('generates a UUIDv7 id', () => {
      const entity = ResourceEntity.create({
        name: 'Alice',
        type: 'employee',
        establishmentId: '1',
      }).getData();

      expect(entity.id).toMatch(UUID_V7_REGEX);
    });
  });

  describe('reconstruct()', () => {
    it('restores all properties', () => {
      const entity = ResourceEntity.reconstruct({
        id: '42',
        code: 'res123',
        name: 'Room B',
        type: 'room',
        establishmentId: '5',
      });

      expect(entity.id).toBe('42');
      expect(entity.code).toBe('res123');
      expect(entity.name).toBe('Room B');
      expect(entity.type).toBe('room');
      expect(entity.establishmentId).toBe('5');
    });
  });
});
