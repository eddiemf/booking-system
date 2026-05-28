import type { Establishment } from '@app/domain/entities';
import type { EstablishmentDTO } from '@app/dtos';

export class EstablishmentMapper {
  static toDTO(establishment: Establishment): EstablishmentDTO {
    return {
      id: establishment.code,
      name: establishment.name,
    };
  }
}
