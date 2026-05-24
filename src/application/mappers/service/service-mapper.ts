import type { ServiceDTO } from "@app/dtos";
import type { ServiceEntity } from "@domain/entities";

export class ServiceMapper {
  static toDTO(serviceEntity: ServiceEntity): ServiceDTO {
    return {
      id: serviceEntity.id,
      name: serviceEntity.name,
      description: serviceEntity.description,
      duration: serviceEntity.duration,
    };
  }
}
