import type { ResourceType } from '@app/domain/entities';

export interface ResourceDTO {
  id: string;
  name: string;
  type: ResourceType;
  establishmentId: string;
}
