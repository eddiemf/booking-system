import { ServiceEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { ServiceMapper } from './service-mapper';

describe('ServiceMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = ServiceEntity.reconstruct({
        id: 'uuid-123',
        code: 'svc123',
        name: 'service',
        description: 'description',
        duration: 60,
        establishmentId: 'uuid-est',
        establishmentCode: 'est123',
      });

      const dto = ServiceMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(ServiceEntity);
      expect(dto).toEqual({
        id: 'svc123',
        name: 'service',
        duration: 60,
        description: 'description',
        establishmentCode: 'est123',
      });
    });
  });
});
