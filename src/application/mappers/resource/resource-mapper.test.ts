import { ResourceEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { ResourceMapper } from './resource-mapper';

describe('ResourceMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = ResourceEntity.reconstruct({
        id: 'uuid-123',
        code: 'res123',
        name: 'Alice',
        establishmentId: 'uuid-est',
        establishmentCode: 'est123',
      });

      const dto = ResourceMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(ResourceEntity);
      expect(dto).toEqual({
        id: 'res123',
        name: 'Alice',
        establishmentCode: 'est123',
      });
    });
  });
});
