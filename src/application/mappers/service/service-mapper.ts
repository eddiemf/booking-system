import type { ServiceEntity } from '@app/domain/entities';
import type { ServiceDTO } from '@app/dtos';

export class ServiceMapper {
  static toDTO(service: ServiceEntity): ServiceDTO {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      establishmentId: service.establishmentId,
    };
  }
}
