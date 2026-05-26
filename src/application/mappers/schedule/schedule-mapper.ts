import type { ScheduleEntity } from '@app/domain/entities';
import type { ScheduleDTO } from '@app/dtos';

export class ScheduleMapper {
  static toDTO(entity: ScheduleEntity): ScheduleDTO {
    return {
      id: entity.id,
      resourceId: entity.resourceId,
      dayOfWeek: entity.dayOfWeek.value,
      startTime: entity.startTime.value,
      endTime: entity.endTime.value,
    };
  }
}
