import type { ResourceEntity } from '@app/domain/entities';
import type { ResourceDTO } from '@app/dtos';

export class ResourceMapper {
  static toDTO(resource: ResourceEntity): ResourceDTO {
    return {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      establishmentId: resource.establishmentId,
    };
  }
}
