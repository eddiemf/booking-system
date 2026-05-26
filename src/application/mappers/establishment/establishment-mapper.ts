import type { EstablishmentEntity } from '@app/domain/entities';
import type { EstablishmentDTO } from '@app/dtos';

export class EstablishmentMapper {
  static toDTO(establishment: EstablishmentEntity): EstablishmentDTO {
    return {
      id: establishment.code,
      name: establishment.name,
    };
  }
}
