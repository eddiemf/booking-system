import type { Schedule } from '@app/domain/entities';
import type { ScheduleDTO } from '@app/dtos';

export class ScheduleMapper {
  static toDTO(entity: Schedule): ScheduleDTO {
    return {
      id: entity.code,
      resourceId: entity.resourceId,
      dayOfWeek: entity.dayOfWeek.value,
      startTime: entity.timeRange.start.value,
      endTime: entity.timeRange.end.value,
    };
  }
}
