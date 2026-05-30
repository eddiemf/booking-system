import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser } from '../helpers/auth';
import { setupFullScenario } from '../helpers/scenario';
import {
  seedEstablishment,
  seedResource,
  seedSchedule,
  seedService,
  seedServiceOffering,
} from '../helpers/seeds';
import { createTestContext } from '../setup';

describe('Availability Feature', () => {
  const ctx = createTestContext();

  beforeEach(() => {
    ctx.clearAllRepositories();
  });

  describe('Get Available Slots', () => {
    it('GET .../availability?date=YYYY-MM-DD — returns slots from schedule', async () => {
      const { establishment, service } = await setupFullScenario(ctx.container, {
        scheduleEntries: [{ dayOfWeek: 3, startTime: '09:00', endTime: '12:00' }],
      });
      // 2026-06-03 is a Wednesday
      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability?date=2026-06-03`
      );

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); // 09:00, 10:00, 11:00
      expect(res.body[0]).toMatchObject({
        startTime: '09:00',
        endTime: '10:00',
        resourceCode: expect.any(String),
        resourceName: 'Alice',
        price: 0,
      });
    });

    it('GET .../availability — empty when no resources assigned', async () => {
      const { user } = await registerUser(ctx.container, 'o@test.com', 'O');
      const establishment = await seedEstablishment(ctx.container, 'Salon', user.id, 'UTC');
      const service = await seedService(
        ctx.container,
        'Test',
        30,
        establishment.id,
        establishment.code
      );

      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability?date=2026-06-03`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('GET .../availability — empty when no schedule matches day', async () => {
      const { establishment, service } = await setupFullScenario(ctx.container, {
        scheduleEntries: [{ dayOfWeek: 3, startTime: '09:00', endTime: '12:00' }],
      });
      // Resource has schedule only on Wednesday (3). Ask for Monday (1).
      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability?date=2026-06-01`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('GET .../availability — uses slotInterval != duration', async () => {
      const { user } = await registerUser(ctx.container, 'o@test.com', 'O');
      const establishment = await seedEstablishment(ctx.container, 'Salon', user.id, 'UTC');
      const resource = await seedResource(
        ctx.container,
        'Alice',
        establishment.id,
        establishment.code
      );
      const service = await seedService(
        ctx.container,
        'Haircut',
        30,
        establishment.id,
        establishment.code
      );
      // duration=30, slotInterval=15
      await seedServiceOffering(ctx.container, {
        serviceId: service.id,
        resourceId: resource.id,
        durationMinutes: 30,
        slotIntervalMinutes: 15,
        serviceCode: service.code,
      });
      await seedSchedule(ctx.container, resource.id, {
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '10:00',
      }); // 60 min window

      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability?date=2026-06-03`
      );

      // With 30min blocks every 15min in a 60min window:
      // 09:00-09:30, 09:15-09:45, 09:30-10:00 = 3 slots
      expect(res.body.length).toBe(3);
    });

    it('GET .../availability — returns 400 when date missing', async () => {
      const { user } = await registerUser(ctx.container, 'o@test.com', 'O');
      const establishment = await seedEstablishment(ctx.container, 'Salon', user.id, 'UTC');
      const service = await seedService(
        ctx.container,
        'Haircut',
        60,
        establishment.id,
        establishment.code
      );

      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability`
      );

      expect(res.status).toBe(400);
    });

    it('GET .../availability — returns 400 for past date', async () => {
      const res = await ctx.request.get(
        '/establishments/nonexistent/services/svc123/availability?date=2020-01-01'
      );

      expect(res.status).toBe(400);
    });

    it('GET .../availability — returns slots from multiple resources', async () => {
      const { user } = await registerUser(ctx.container, 'o@test.com', 'O');
      const establishment = await seedEstablishment(ctx.container, 'Salon', user.id, 'UTC');
      const res1 = await seedResource(ctx.container, 'Alice', establishment.id, establishment.code);
      const res2 = await seedResource(ctx.container, 'Bob', establishment.id, establishment.code);
      const service = await seedService(
        ctx.container,
        'Massage',
        60,
        establishment.id,
        establishment.code
      );
      await seedServiceOffering(ctx.container, {
        serviceId: service.id,
        resourceId: res1.id,
        durationMinutes: 60,
        slotIntervalMinutes: 60,
        serviceCode: service.code,
      });
      await seedServiceOffering(ctx.container, {
        serviceId: service.id,
        resourceId: res2.id,
        durationMinutes: 60,
        slotIntervalMinutes: 60,
        serviceCode: service.code,
      });
      await seedSchedule(ctx.container, res1.id, {
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '10:00',
      });
      await seedSchedule(ctx.container, res2.id, {
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:00',
      });

      const res = await ctx.request.get(
        `/establishments/${establishment.code}/services/${service.code}/availability?date=2026-06-03`
      );

      expect(res.body.length).toBe(2); // 1 slot from each resource
    });
  });
});
