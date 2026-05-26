import { ScheduleEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { ScheduleMapper } from './schedule-mapper';

describe('ScheduleMapper', () => {
  it('maps a ScheduleEntity to a ScheduleDTO', () => {
    const entity = ScheduleEntity.reconstruct({
      id: '5',
      code: 'sch123',
      resourceId: '1',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:00',
    });

    const dto = ScheduleMapper.toDTO(entity);

    expect(dto).toEqual({
      id: 'sch123',
      resourceId: '1',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:00',
    });
  });
});
