import type { ServiceDTO } from '@app/dtos';
import type { ServiceEntity } from '@domain/entities';

export class ServiceMapper {
  static toDTO(serviceEntity: ServiceEntity): ServiceDTO {
    return {
      id: serviceEntity.getId(),
      name: serviceEntity.getName(),
      description: serviceEntity.getDescription(),
      duration: serviceEntity.getDuration(),
    };
  }
}
