import { ServiceEntity } from '@domain/entities';
import { ServiceMapper } from './service-mapper';

describe('ServiceMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const serviceResult = ServiceEntity.create({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      });

      if (!serviceResult.isOk) throw new Error('Expected service creation to succeed');

      expect(ServiceMapper.toDTO(serviceResult.data)).toEqual({
        id: '123',
        name: 'service',
        duration: 60,
        description: 'description',
      });
    });
  });
});
