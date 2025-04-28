import { ServiceEntity } from '@domain/entities';
import { ServiceDTO } from '@app/dtos';

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
