import { EstablishmentEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { EstablishmentMapper } from './establishment-mapper';

describe('EstablishmentMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = EstablishmentEntity.reconstruct({
        id: 'uuid-1',
        code: 'abc123',
        name: 'My Salon',
      });

      const dto = EstablishmentMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(EstablishmentEntity);
      expect(dto).toEqual({ id: 'abc123', name: 'My Salon' });
    });
  });
});
