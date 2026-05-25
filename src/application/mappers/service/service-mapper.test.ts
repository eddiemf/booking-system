import { ServiceEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { ServiceMapper } from './service-mapper';

describe('ServiceMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = ServiceEntity.create({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      }).getData();

      const dto = ServiceMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(ServiceEntity);
      expect(dto).toEqual({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      });
    });
  });
});
