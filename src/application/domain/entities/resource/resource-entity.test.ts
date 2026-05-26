import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { ScheduleEntity } from '../schedule/schedule-entity';
import { ResourceEntity } from './resource-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('ResourceEntity', () => {
  describe('create()', () => {
    it('fails with empty name', () => {
      const error = ResourceEntity.create({
        name: '',
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('creates a resource successfully', () => {
      const entity = ResourceEntity.create({
        name: 'Alice',
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(entity).toBeInstanceOf(ResourceEntity);
      expect(entity.establishmentId).toBe('1');
    });

    it('generates a UUIDv7 id', () => {
      const entity = ResourceEntity.create({
        name: 'Alice',
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(entity.id).toMatch(UUID_V7_REGEX);
    });

    it('starts with an empty schedules list', () => {
      const entity = ResourceEntity.create({
        name: 'Alice',
        establishmentId: '1',
        establishmentCode: 'est123',
      }).getData();

      expect(entity.schedules).toEqual([]);
    });
  });

  describe('reconstruct()', () => {
    it('restores all properties', () => {
      const entity = ResourceEntity.reconstruct({
        id: '42',
        code: 'res123',
        name: 'Room B',
        establishmentId: '5',
        establishmentCode: 'est123',
      });

      expect(entity.id).toBe('42');
      expect(entity.code).toBe('res123');
      expect(entity.name).toBe('Room B');
      expect(entity.establishmentId).toBe('5');
      expect(entity.schedules).toEqual([]);
    });

    it('restores schedules when provided', () => {
      const schedule = ScheduleEntity.reconstruct({
        id: 'sched-1',
        code: 'sch1',
        resourceId: '42',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });
      const entity = ResourceEntity.reconstruct({
        id: '42',
        code: 'res123',
        name: 'Room B',
        establishmentId: '5',
        establishmentCode: 'est123',
        schedules: [schedule],
      });

      expect(entity.schedules).toHaveLength(1);
      expect(entity.schedules[0]).toBe(schedule);
    });
  });

  describe('update()', () => {
    const resource = ResourceEntity.reconstruct({
      id: '42',
      code: 'res123',
      name: 'Old Name',
      establishmentId: '5',
      establishmentCode: 'est123',
    });

    it('fails with empty name', () => {
      const error = resource.update({ name: '' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value for field: name. Value is required.');
    });

    it('mutates the entity in place and returns it', () => {
      const updatedResource = resource.update({ name: 'New Name' }).getData();

      expect(updatedResource.name).toBe('New Name');
      expect(updatedResource.id).toBe(resource.id);
      expect(updatedResource.code).toBe(resource.code);
      expect(updatedResource.establishmentId).toBe(resource.establishmentId);
      expect(updatedResource.schedules).toEqual(resource.schedules);
    });
  });

  describe('setSchedule()', () => {
    const resource = ResourceEntity.reconstruct({
      id: '42',
      code: 'res123',
      name: 'Room A',
      establishmentId: '5',
      establishmentCode: 'est123',
    });

    it('fails with an invalid entry', () => {
      const error = resource
        .setSchedule([{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }])
        .getError();

      expect(error).toBeInstanceOf(ValidationError);
    });

    it('mutates the entity schedules in place and returns it', () => {
      const updatedResource = resource
        .setSchedule([{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }])
        .getData();

      expect(updatedResource.schedules).toHaveLength(1);
      expect(updatedResource.schedules[0]?.dayOfWeek.value).toBe(1);
      expect(updatedResource.schedules[0]?.timeRange.start.value).toBe('09:00');
      expect(updatedResource.schedules[0]?.timeRange.end.value).toBe('17:00');
      expect(updatedResource.id).toBe(resource.id);
      expect(updatedResource.name).toBe(resource.name);
    });

    it('replaces existing schedules', () => {
      const resourceWithSchedules = ResourceEntity.reconstruct({
        id: '42',
        code: 'res123',
        name: 'Room A',
        establishmentId: '5',
        establishmentCode: 'est123',
        schedules: [
          ScheduleEntity.reconstruct({
            id: '1',
            code: 'sch1',
            resourceId: '42',
            dayOfWeek: 0,
            startTime: '08:00',
            endTime: '18:00',
          }),
        ],
      });

      const updatedResource = resourceWithSchedules.setSchedule([]).getData();

      expect(updatedResource.schedules).toHaveLength(0);
    });
  });
});
