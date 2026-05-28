import { ResourceEntity, ServiceOfferingEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { ServiceOfferingMapper } from './service-offering-mapper';

describe('ServiceOfferingMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = ServiceOfferingEntity.reconstruct({
        id: 'uuid-123',
        code: 'off123',
        serviceId: 'uuid-svc',
        resourceId: 'uuid-res',
        maxCapacity: 5,
        durationMinutes: 60,
        slotIntervalMinutes: 30,
        price: 5000,
      });

      const resource = ResourceEntity.reconstruct({
        id: 'uuid-res',
        code: 'res123',
        name: 'Alice',
        establishmentId: 'uuid-est',
        establishmentCode: 'est123',
      });

      const dto = ServiceOfferingMapper.toDTO(entity, 'svc123', resource);

      expect(dto).not.toBeInstanceOf(ServiceOfferingEntity);
      expect(dto).toEqual({
        id: 'off123',
        serviceCode: 'svc123',
        resourceCode: 'res123',
        resourceName: 'Alice',
        maxCapacity: 5,
        durationMinutes: 60,
        slotIntervalMinutes: 30,
        price: 5000,
      });
    });
  });
});
