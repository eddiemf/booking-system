import type { ResourceEntity } from '@app/domain/entities';
import type { ResourceDTO } from '@app/dtos';

export class ResourceMapper {
  static toDTO(resource: ResourceEntity): ResourceDTO {
    return {
      id: resource.code,
      name: resource.name,
      establishmentCode: resource.establishmentCode,
    };
  }
}
