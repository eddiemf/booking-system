import type { Service } from '@app/domain/entities';
import type { ServiceDTO } from '@app/dtos';

export class ServiceMapper {
  static toDTO(service: Service): ServiceDTO {
    return {
      id: service.code,
      name: service.name,
      description: service.description,
      duration: service.duration.toMinutes(),
      establishmentCode: service.establishmentCode,
    };
  }
}
