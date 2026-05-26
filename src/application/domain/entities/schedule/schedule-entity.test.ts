import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { ScheduleEntity } from './schedule-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('ScheduleEntity', () => {
  const validProps = { resourceId: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };

  describe('create()', () => {
    it('fails when dayOfWeek is negative', () => {
      const error = ScheduleEntity.create({ ...validProps, dayOfWeek: -1 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('dayOfWeek');
    });

    it('fails when dayOfWeek is greater than 6', () => {
      const error = ScheduleEntity.create({ ...validProps, dayOfWeek: 7 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('dayOfWeek');
    });

    it('fails when dayOfWeek is not an integer', () => {
      const error = ScheduleEntity.create({ ...validProps, dayOfWeek: 1.5 }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('dayOfWeek');
    });

    it('fails when startTime has invalid format', () => {
      const error = ScheduleEntity.create({ ...validProps, startTime: '9:00' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when startTime has invalid hours', () => {
      const error = ScheduleEntity.create({ ...validProps, startTime: '25:00' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startTime');
    });

    it('fails when endTime has invalid format', () => {
      const error = ScheduleEntity.create({ ...validProps, endTime: '1700' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('fails when endTime is not after startTime', () => {
      const error = ScheduleEntity.create({
        ...validProps,
        startTime: '10:00',
        endTime: '09:00',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('fails when endTime equals startTime', () => {
      const error = ScheduleEntity.create({
        ...validProps,
        startTime: '09:00',
        endTime: '09:00',
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endTime');
    });

    it('creates a valid entity', () => {
      const entity = ScheduleEntity.create(validProps).getData();

      expect(entity).toBeInstanceOf(ScheduleEntity);
      expect(entity.resourceId).toBe('1');
      expect(entity.dayOfWeek.value).toBe(1);
      expect(entity.timeRange.start.value).toBe('09:00');
      expect(entity.timeRange.end.value).toBe('17:00');
    });

    it('generates a UUIDv7 id', () => {
      const entity = ScheduleEntity.create(validProps).getData();

      expect(entity.id).toMatch(UUID_V7_REGEX);
    });

    it('accepts dayOfWeek 0 (Sunday)', () => {
      const entity = ScheduleEntity.create({ ...validProps, dayOfWeek: 0 }).getData();

      expect(entity.dayOfWeek.value).toBe(0);
    });

    it('accepts dayOfWeek 6 (Saturday)', () => {
      const entity = ScheduleEntity.create({ ...validProps, dayOfWeek: 6 }).getData();

      expect(entity.dayOfWeek.value).toBe(6);
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs with the given id', () => {
      const entity = ScheduleEntity.reconstruct({ id: '5', ...validProps });

      expect(entity.id).toBe('5');
      expect(entity.resourceId).toBe('1');
    });
  });
});
