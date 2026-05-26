import type { ScheduleEntity } from '@app/domain/entities';
import type { ScheduleDTO } from '@app/dtos';

export class ScheduleMapper {
  static toDTO(entity: ScheduleEntity): ScheduleDTO {
    return {
      id: entity.id,
      resourceId: entity.resourceId,
      dayOfWeek: entity.dayOfWeek,
      startTime: entity.startTime,
      endTime: entity.endTime,
    };
  }
}
