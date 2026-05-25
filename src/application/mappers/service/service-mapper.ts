import type { ServiceDTO } from '@app/dtos';
import type { ServiceEntity } from '@domain/entities';

export class ServiceMapper {
  static toDTO(service: ServiceEntity): ServiceDTO {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
    };
  }
}
