import { Establishment } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { EstablishmentMapper } from './establishment-mapper';

describe('EstablishmentMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = Establishment.reconstruct({
        id: 'uuid-1',
        code: 'abc123',
        name: 'My Salon',
        userId: 'uuid-user',
      });

      const dto = EstablishmentMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(Establishment);
      expect(dto).toEqual({ id: 'abc123', name: 'My Salon' });
    });
  });
});
