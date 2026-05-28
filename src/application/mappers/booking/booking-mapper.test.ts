import { BookingEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { BookingMapper } from './booking-mapper';

describe('BookingMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = BookingEntity.reconstruct({
        id: 'uuid-123',
        code: 'bkg123',
        customerId: 'uuid-cust',
        customerCode: 'usr123',
        customerName: 'Alice',
        establishmentId: 'uuid-est',
        establishmentCode: 'est123',
        serviceId: 'uuid-svc',
        serviceCode: 'svc123',
        serviceName: 'Haircut',
        resourceId: 'uuid-res',
        resourceCode: 'res123',
        resourceName: 'Bob',
        startsAt: '2026-06-15T09:00:00Z',
        endsAt: '2026-06-15T10:00:00Z',
        status: 'confirmed',
      });

      const dto = BookingMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(BookingEntity);
      expect(dto).toEqual({
        id: 'bkg123',
        customerCode: 'usr123',
        customerName: 'Alice',
        serviceCode: 'svc123',
        serviceName: 'Haircut',
        resourceCode: 'res123',
        resourceName: 'Bob',
        establishmentCode: 'est123',
        startsAt: '2026-06-15T09:00:00Z',
        endsAt: '2026-06-15T10:00:00Z',
        status: 'confirmed',
      });
    });

    it('maps cancelled status correctly', () => {
      const entity = BookingEntity.reconstruct({
        id: 'uuid-1',
        code: 'bkg1',
        customerId: 'uuid-cust',
        customerCode: 'usr1',
        customerName: 'Alice',
        establishmentId: 'uuid-est',
        establishmentCode: 'est123',
        serviceId: 'uuid-svc',
        serviceCode: 'svc1',
        serviceName: 'Trim',
        resourceId: 'uuid-res',
        resourceCode: 'res1',
        resourceName: 'Bob',
        startsAt: '2026-06-15T09:00:00Z',
        endsAt: '2026-06-15T10:00:00Z',
        status: 'cancelled',
      });

      const dto = BookingMapper.toDTO(entity);

      expect(dto.status).toBe('cancelled');
    });
  });
});
